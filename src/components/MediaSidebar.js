import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const MediaSidebar = ({ files, onFileUpload, onFileSelect, selectedFile }) => {
  // eslint-disable-next-line no-unused-vars
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setUploading(true);
    
    uploadedFiles.forEach(file => {
      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          setUploading(false);
          
          if (onFileUpload) {
            onFileUpload(file);
          }
        }
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: progress
        }));
      }, 500);
    });
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box 
      sx={{
        width: 240,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Media</Typography>
          <IconButton size="small">
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        
        <label htmlFor="upload-input">
          <input
            id="upload-input"
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="video/*,image/*,audio/*"
          />
          <Button
            component="span"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ 
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'action.hover'
              }
            }}
          >
            Upload
          </Button>
        </label>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {files?.map(file => (
          <ListItem 
            key={file.id}
            selected={selectedFile?.id === file.id}
            onClick={() => onFileSelect?.(file)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover'
              },
              cursor: 'pointer'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getFileIcon(file.type)}
            </ListItemIcon>
            <ListItemText 
              primary={file.name}
              secondary={formatFileSize(file.size)}
              primaryTypographyProps={{
                variant: 'body2',
                noWrap: true
              }}
              secondaryTypographyProps={{
                variant: 'caption'
              }}
            />
          </ListItem>
        ))}

        {Object.entries(uploadProgress).map(([id, progress]) => (
          progress < 100 && (
            <ListItem 
              key={id}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                display: 'block'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CloudUploadIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2">Uploading...</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{ height: 2 }}
              />
            </ListItem>
          )
        ))}
      </List>
    </Box>
  );
};

export default MediaSidebar;