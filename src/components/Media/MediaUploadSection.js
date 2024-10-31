// src/components/Media/MediaUploadSection.js
import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const MediaUploadSection = ({ onFileUpload }) => (
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h6">Media</Typography>
      <IconButton size="small">
        <ExpandMoreIcon />
      </IconButton>
    </Box>

    <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
      Upload video files with matching .json transcripts
    </Typography>

    <label htmlFor="upload-input">
      <input
        id="upload-input"
        type="file"
        multiple
        onChange={onFileUpload}
        style={{ display: 'none' }}
        accept="video/*,image/*,audio/*,.json"
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
);