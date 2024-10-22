// src/components/Layout/MainLayout.js
import React from 'react';
import { Box } from '@mui/material';
import MediaSidebar from '../MediaSidebar';


const MainLayout = ({ 
  mediaFiles, 
  selectedBinClip,
  onFileUpload, 
  onFileSelect,
  children 
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <MediaSidebar 
        files={mediaFiles}
        onFileUpload={onFileUpload}
        onFileSelect={onFileSelect}
        selectedFile={selectedBinClip}
      />
      {children}
    </Box>
  );
};
export default MainLayout;