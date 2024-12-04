// src/components/Media/MediaSidebar.js
import React, { useState, useCallback } from 'react';
import { 
  Button, 
  IconButton, 
  Box, 
  Input,
  Typography,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  AddCircleOutline as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowRight as ArrowRightIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useFileSystem, FileType } from '../../contexts/FileSystemContext';

const FileTypeIcon = ({ type }) => {
  switch (type) {
    case 'folder':
      return <FolderIcon fontSize="small" />;
    case 'media':
      return <ImageIcon fontSize="small" />;
    default:
      return <DescriptionIcon fontSize="small" />;
  }
};

const FileItem = ({ file, onSelect, isSelected, onDelete }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderRadius: 1,
      }}
      onClick={() => onSelect(file)}
    >
      <FileTypeIcon type={file.type} />
      <Typography
        variant="body2"
        sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {file.name}
      </Typography>
      {onDelete && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

const FileSystemTree = ({ parentId }) => {
  const {
    files,
    selectedItems,
    moveItem,
    deleteItem,
    renameItem,
    createFolder,
    getDirectoryItems
  } = useFileSystem();

  const [openFolders, setOpenFolders] = useState(new Set());
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  const toggleFolder = useCallback((folderId, e) => {
    e.stopPropagation();
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const handleCreateFolder = () => {
    if (newItemName.trim()) {
      createFolder(newItemName.trim(), parentId);
      setNewItemName('');
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = (e, itemId) => {
    e.stopPropagation();
    deleteItem(itemId);
  };

  const handleRename = (e, itemId) => {
    e.stopPropagation();
    setEditingItemId(itemId);
    setNewItemName(files[itemId].name);
  };

  const handleRenameSubmit = (itemId) => {
    if (newItemName.trim()) {
      renameItem(itemId, newItemName.trim());
      setEditingItemId(null);
      setNewItemName('');
    }
  };

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    setDragOverItemId(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId !== targetId && files[targetId]?.type === FileType.FOLDER) {
      moveItem(draggedId, targetId, null);
    }
    
    setDragOverItemId(null);
  };

  const renderItem = (item) => {
    const isFolder = item.type === FileType.FOLDER;
    const isSelected = selectedItems.includes(item.id);
    const isDraggedOver = dragOverItemId === item.id && isFolder;

    return (
      <Box
        key={item.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: isDraggedOver ? 'action.hover' : isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          border: isDraggedOver ? '2px dashed primary.main' : 'none',
          transition: 'all 0.2s',
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.id)}
      >
        {isFolder && (
          <IconButton
            size="small"
            onClick={(e) => toggleFolder(item.id, e)}
            sx={{ p: 0.5 }}
          >
            {openFolders.has(item.id) ? <ArrowDownIcon /> : <ArrowRightIcon />}
          </IconButton>
        )}
        <FileTypeIcon type={item.type} />
        {editingItemId === item.id ? (
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={() => handleRenameSubmit(item.id)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit(item.id)}
            size="small"
            fullWidth
            onClick={(e) => e.stopPropagation()}
            autoFocus
            sx={{ mx: 1 }}
          />
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </Box>
        )}
        <IconButton
          size="small"
          onClick={(e) => handleRename(e, item.id)}
          sx={{ p: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => handleDelete(e, item.id)}
          sx={{ p: 0.5 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const items = getDirectoryItems(parentId);

  return (
    <Box sx={{ pl: 2 }}>
      {items.map(item => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          {item.type === FileType.FOLDER && openFolders.has(item.id) && (
            <Box sx={{ ml: 2 }}>
              <FileSystemTree parentId={item.id} />
            </Box>
          )}
        </React.Fragment>
      ))}
      {isCreatingFolder ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New folder name"
            size="small"
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <Button
            size="small"
            onClick={handleCreateFolder}
            variant="contained"
          >
            Create
          </Button>
        </Box>
      ) : (
        <Button
          startIcon={<AddIcon />}
          onClick={() => setIsCreatingFolder(true)}
          fullWidth
          sx={{ mt: 1 }}
        >
          New Folder
        </Button>
      )}
    </Box>
  );
};

const MediaSidebar = ({ 
  files = [],
  onFileUpload,
  onFileSelect,
  selectedFile,
  timelineProjects
}) => {
  const [uploadError, setUploadError] = useState(null);
  const { addFile } = useFileSystem();

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files?.length) {
      for (const file of files) {
        try {
          await addFile(file, null);
          if (onFileUpload) {
            onFileUpload(file);
          }
        } catch (error) {
          console.error('Failed to upload file:', error);
          setUploadError(error.message);
        }
      }
    }
    event.target.value = '';
  };

  return (
    <Box sx={{ 
      width: '300px', 
      height: '100%', 
      borderRight: 1, 
      borderColor: 'divider',
      overflow: 'auto'
    }}>
      <Box sx={{ p: 2 }}>
        <input
          type="file"
          id="media-upload"
          multiple
          onChange={handleFileUpload}
          accept="video/*,image/*,audio/*,.json"
          style={{ display: 'none' }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={() => document.getElementById('media-upload').click()}
          sx={{ mb: 2 }}
        >
          Upload Media
        </Button>
        {timelineProjects && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={timelineProjects.onSave}
              sx={{ mb: 1 }}
            >
              Save Timeline
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={timelineProjects.onLoad}
            >
              Load Timeline
            </Button>
          </Box>
        )}
        <FileSystemTree 
          parentId={null} 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      </Box>
      {uploadError && (
        <Box sx={{ 
          p: 2, 
          color: 'error.main',
          bgcolor: 'error.light',
          mt: 2
        }}>
          {uploadError}
        </Box>
      )}
    </Box>
  );
};

export default MediaSidebar;