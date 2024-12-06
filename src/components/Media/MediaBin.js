// src/components/Media/MediaSidebar.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
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
  const { addFile, createFolder } = useFileSystem();
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  // ... drag and drop handlers remain the same ...

  return (
    <Box sx={{
      width: 250,
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Assets</Typography>
        <IconButton 
          size="small" 
          onClick={handleAddClick}
        >
          <AddIcon />
        </IconButton>
        <Menu
          anchorEl={addMenuAnchorEl}
          open={Boolean(addMenuAnchorEl)}
          onClose={handleAddMenuClose}
        >
          <MenuItem onClick={() => fileInputRef.current?.click()}>
            <UploadIcon fontSize="small" sx={{ mr: 1 }} />
            Upload
          </MenuItem>
          <MenuItem onClick={handleCreateFolder}>
            <CreateNewFolderIcon fontSize="small" sx={{ mr: 1 }} />
            New Folder
          </MenuItem>
          <MenuItem onClick={handleAddMenuClose}>
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
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <FileSystemTree parentId={null} />
      </Box>

      {isDraggingExternal && (
        <Box sx={{
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
        }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Drop files here to upload
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MediaSidebar;