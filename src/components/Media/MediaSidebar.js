// src/components/Media/MediaSidebar.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Description as DocxIcon,
  SubtitlesOutlined as SrtIcon,
  Code as JsonIcon,
  InsertDriveFile as DefaultFileIcon,
} from '@mui/icons-material';
import { useFileSystem } from '../../contexts/FileSystemContext';

const FileTypeIcon = ({ type }) => {
  switch (type) {
    case 'folder':
      return <FolderIcon fontSize="small" />;
    case 'docx':
      return <DocxIcon fontSize="small" />;
    case 'srt':
    case 'srtx':
      return <SrtIcon fontSize="small" />;
    case 'json':
      return <JsonIcon fontSize="small" />;
    default:
      return <DefaultFileIcon fontSize="small" />;
  }
};

const MediaSidebar = () => {
  const { addFile, createFolder } = useFileSystem();
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const dragCounter = useRef(0);

  const handleFileUpload = useCallback(async (files) => {
    setIsUploading(true);

    try {
      for (const file of files) {
        console.log('Processing file upload:', file.name);
        await addFile(file, null);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [addFile]);

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      createFolder(folderName, null);
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingExternal(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingExternal(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingExternal(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <Box sx={{ 
      width: 250, 
      height: '100%', 
      borderRight: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          accept=".json,.docx,.srt,.srtx,video/*"
          style={{ display: 'none' }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => document.getElementById('file-upload').click()}
          disabled={isUploading}
          sx={{ mr: 1, fontSize: '0.75rem' }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCreateFolder}
          startIcon={<CreateNewFolderIcon />}
          sx={{ fontSize: '0.75rem' }}
        >
          New Folder
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <FileSystemTree parentId={null} />
      </Box>
      {isDraggingExternal && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Drop files here to upload
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const FileItem = ({ file, depth = 0, onDragOver }) => {
  const { moveItem, deleteItem, renameItem, selectedItems, setSelectedItems, files } = useFileSystem();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef(null);

  const isSelected = selectedItems.includes(file.id);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    setIsRenaming(true);
    handleMenuClose();
  };

  const handleRenameSubmit = () => {
    renameItem(file.id, newName);
    setIsRenaming(false);
  };

  const handleDelete = () => {
    deleteItem(file.id);
    handleMenuClose();
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', file.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      if (y < rect.height / 2) {
        onDragOver(file.id, 'before');
      } else if (file.type === 'folder') {
        onDragOver(file.id, 'inside');
      } else {
        onDragOver(file.id, 'after');
      }
    }
  };

  const getAllChildFiles = (folderId) => {
    const result = [];

    const traverse = (id) => {
      const children = Object.values(files).filter(file => file.parentId === id);
      children.forEach(child => {
        if (child.type !== 'folder') {
          result.push(child.id);
        } else {
          traverse(child.id);
        }
      });
    };

    traverse(folderId);
    return result;
  };

  const handleSelect = (event) => {
    event.stopPropagation();
    if (file.type === 'folder') {
      const allChildFiles = getAllChildFiles(file.id);
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        allChildFiles.forEach(childId => {
          if (newSelection.has(childId)) {
            newSelection.delete(childId);
          } else {
            newSelection.add(childId);
          }
        });
        return Array.from(newSelection);
      });
    } else {
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(file.id)) {
          newSelection.delete(file.id);
        } else {
          newSelection.add(file.id);
        }
        return Array.from(newSelection);
      });
    }
  };

  return (
    <Box
      ref={ref}
      draggable={!isDragging}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onClick={handleSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        pl: 1 + depth * 2,
        py: 0.5,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        transition: 'background-color 0.2s',
        borderRadius: '4px',
        mx: 0.5,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <FileTypeIcon type={file.type} sx={{ mr: 1, color: isSelected ? 'primary.main' : 'inherit' }} />
      {isRenaming ? (
        <TextField
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
          size="small"
          autoFocus
          sx={{ fontSize: '0.75rem' }}
        />
      ) : (
        <Typography 
          variant="body2" 
          sx={{ 
            flexGrow: 1, 
            fontSize: '0.75rem', 
            color: isSelected ? 'primary.main' : 'inherit',
            fontWeight: isSelected ? 'bold' : 'normal',
          }}
        >
          {file.name}
        </Typography>
      )}
      <IconButton size="small" onClick={handleMenuOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRename}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Rename
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

const FileSystemTree = ({ parentId, depth = 0 }) => {
  const { getDirectoryItems, moveItem } = useFileSystem();
  const [dropTarget, setDropTarget] = useState(null);
  const items = getDirectoryItems(parentId);

  const handleDragOver = (id, position) => {
    setDropTarget({ id, position });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('text');
    if (dropTarget && draggedItemId !== dropTarget.id) {
      const targetIndex = items.findIndex(item => item.id === dropTarget.id);
      let newIndex;
      if (dropTarget.position === 'before') {
        newIndex = targetIndex;
      } else if (dropTarget.position === 'after') {
        newIndex = targetIndex + 1;
      } else { // 'inside'
        moveItem(draggedItemId, dropTarget.id);
        setDropTarget(null);
        return;
      }
      
      const draggedIndex = items.findIndex(item => item.id === draggedItemId);
      if (draggedIndex < newIndex) {
        newIndex--;
      }
      
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(newIndex, 0, removed);
      
      // Update the order of items
      newItems.forEach((item, index) => {
        moveItem(item.id, parentId, index * 1000);
      });
    }
    setDropTarget(null);
  };

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {dropTarget && dropTarget.id === item.id && dropTarget.position === 'before' && (
            <Box sx={{ height: '2px', bgcolor: 'primary.main', mx: 1 }} />
          )}
          <FileItem 
            file={item} 
            depth={depth} 
            onDragOver={handleDragOver}
          />
          {item.type === 'folder' && (
            <FileSystemTree parentId={item.id} depth={depth + 1} />
          )}
          {dropTarget && dropTarget.id === item.id && dropTarget.position === 'after' && (
            <Box sx={{ height: '2px', bgcolor: 'primary.main', mx: 1 }} />
          )}
        </React.Fragment>
      ))}
      {dropTarget && dropTarget.id === parentId && (
        <Box sx={{ height: '2px', bgcolor: 'primary.main', mx: 1 }} />
      )}
    </Box>
  );
};

export default MediaSidebar;