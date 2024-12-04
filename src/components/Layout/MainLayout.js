// src/components/Layout/MainLayout.js
import React from 'react';
import { Box } from '@mui/material';
import MediaSidebar from '../Media/MediaSidebar';

const MainLayout = ({ 
  mediaFiles = [], 
  selectedBinClip,
  onFileUpload, 
  onFileSelect,
  timelineProjects,
  children 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        overflow: 'hidden'
      }}
    >
      <MediaSidebar 
        files={mediaFiles}
        onFileUpload={onFileUpload}
        onFileSelect={onFileSelect}
        selectedFile={selectedBinClip}
        timelineProjects={timelineProjects}
      />
      <Box 
        sx={{ 
          flexGrow: 1, 
          height: '100%',
          overflow: 'auto',
          p: 2
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;