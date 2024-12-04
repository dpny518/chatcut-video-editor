// src/components/Media/MediaSidebar.js
import React, { useState } from 'react';
import { 
  Box, 
  Button,
  Typography,
} from '@mui/material';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { getFileType, FileTypeIcon } from '../../utils/fileUtils';

const MediaSidebar = () => {
  const { addFile, selectedItems, setSelectedItems } = useFileSystem();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    setIsUploading(true);

    try {
      for (const file of files) {
        console.log('Processing file upload:', file.name);
        const fileId = await addFile(file, null);
        
        // Automatically select uploaded transcript files
        if (file.name.endsWith('.json')) {
          setSelectedItems(prev => [...prev, fileId]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <Box sx={{ width: 300, height: '100%', borderRight: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2 }}>
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileUpload}
          accept=".json,.docx,.srt,.srtx,video/*"
          style={{ display: 'none' }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={() => document.getElementById('file-upload').click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
        <FileSystemTree parentId={null} />
      </Box>
    </Box>
  );
};

const FileItem = ({ file, isSelected, onToggleSelect }) => {
  const type = getFileType(file.name);
  
  return (
    <Box
      onClick={() => onToggleSelect(file.id)}
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
    >
      <FileTypeIcon 
        type={type} 
        sx={{ 
          fontSize: '1.2rem',
          color: 'text.secondary'
        }} 
      />
      <Typography
        variant="body2"
        sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {file.name}
      </Typography>
    </Box>
  );
};

const FileSystemTree = ({ parentId }) => {
  const { files, selectedItems, setSelectedItems, getDirectoryItems } = useFileSystem();

  const handleToggleSelect = (fileId) => {
    setSelectedItems(prev => {
      const prevSet = new Set(prev);
      if (prevSet.has(fileId)) {
        prevSet.delete(fileId);
      } else {
        prevSet.add(fileId);
      }
      return Array.from(prevSet);
    });
  };

  const items = getDirectoryItems(parentId);

  return (
    <Box sx={{ pl: 2 }}>
      {items.map(item => (
        <FileItem
          key={item.id}
          file={item}
          isSelected={selectedItems.includes(item.id)}
          onToggleSelect={handleToggleSelect}
        />
      ))}
    </Box>
  );
};

export default MediaSidebar;