import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import SvgIcon from '@mui/material/SvgIcon';


const Input = styled('input')({
  display: 'none',
});

const MediaLibrary = ({ videos, onVideoUpload, onFileSelect, selectedClip }) => {
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onVideoUpload(file);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Input
        accept="video/*"
        id="video-upload"
        type="file"
        onChange={handleVideoUpload}
      />
      <label htmlFor="video-upload">
        <Button variant="contained" fullWidth sx={{ mb: 2 }} component="span">
          Upload Video
        </Button>
      </label>
      <List>
        {videos.map((video) => (
          <ListItem 
            button 
            key={video.id} 
            onClick={() => onFileSelect(video)}
            selected={selectedClip && selectedClip.id === video.id}
          >
            <ListItemIcon>
              <VideoFileIcon />
            </ListItemIcon>
            <ListItemText primary={video.file.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MediaLibrary;