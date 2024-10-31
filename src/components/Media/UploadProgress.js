// src/components/Media/UploadProgress.js
import React from 'react';
import { Box, Typography, ListItem, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export const UploadProgress = ({ uploadProgress }) => {
  return (
    <>
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
    </>
  );
};