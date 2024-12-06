// src/components/Media/MediaSidebar.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  CreateNewFolder as CreateNewFolderIcon,
  VideoFile as PaperCutIcon
} from '@mui/icons-material';
import { useFileSystem } from '../../contexts/FileSystemContext';
import FileSystemTree from './FileSystemTree';

const MediaSidebar = () => {
  const { addFile, createFolder, setSelectedItems } = useFileSystem();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  const handleAddClick = (event) => {
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      createFolder(folderName, null);
    }
    handleAddMenuClose();
  };

  const handleFileUpload = useCallback(async (files) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Convert FileList to array and upload each file
      const fileArray = Array.from(files);
      
      // Upload files sequentially
      for (const file of fileArray) {
        const fileId = await addFile(file, null);
        if (!fileId) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        console.log(`Successfully uploaded ${file.name} with ID: ${fileId}`);
      }
      
      handleAddMenuClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  }, [addFile, handleAddMenuClose]);

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

  const handleContainerClick = (event) => {
    // Only clear selection if clicking directly on the container
    if (event.target === event.currentTarget) {
      setSelectedItems([]);
    }
  };

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
    <Paper sx={{ 
      width: 250,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      overflow: 'hidden',
      '& > *': {
        margin: 0
      }
    }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        px: 2
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.primary',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
          }}
        >
          Assets
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleAddClick}
          sx={{
            bgcolor: 'action.hover',
            width: 24,
            height: 24,
            '&:hover': {
              bgcolor: 'action.selected',
            }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={addMenuAnchorEl}
          open={Boolean(addMenuAnchorEl)}
          onClose={handleAddMenuClose}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 2,
            }
          }}
        >
          <MenuItem 
            onClick={() => fileInputRef.current?.click()}
            sx={{ fontSize: '0.875rem' }}
          >
            <UploadIcon fontSize="small" sx={{ mr: 1 }} />
            Upload
          </MenuItem>
          <MenuItem 
            onClick={handleCreateFolder}
            sx={{ fontSize: '0.875rem' }}
          >
            <CreateNewFolderIcon fontSize="small" sx={{ mr: 1 }} />
            New Folder
          </MenuItem>
          <MenuItem 
            onClick={handleAddMenuClose}
            sx={{ fontSize: '0.875rem' }}
          >
            <PaperCutIcon fontSize="small" sx={{ mr: 1 }} />
            New Papercut
          </MenuItem>
        </Menu>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          accept=".json,.docx,.srt,.srtx,video/*"
        />
      </Box>
      
      <Box 
        onClick={handleContainerClick}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <FileSystemTree parentId={null} />
      </Box>

      {isDraggingExternal && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Typography 
            variant="body1"
            sx={{ color: 'common.white' }}
          >
            Drop files here to upload
          </Typography>
        </Box>
      )}

      {isUploading && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
        }}>
          <Alert severity="info">
            Uploading files...
          </Alert>
        </Box>
      )}

      {uploadError && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
        }}>
          <Alert 
            severity="error" 
            onClose={() => setUploadError(null)}
          >
            {uploadError}
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default MediaSidebar;