import React from 'react';
import { Box } from '@mui/material';
import MediaSidebar from '../Media/MediaSidebar';

const MainLayout = ({ 
  mediaFiles, 
  selectedFiles,
  onFileUpload, 
  onFileSelect,
  timelineProjects, // Make sure this prop is being passed
  children 
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <MediaSidebar 
        files={mediaFiles}
        onFileUpload={onFileUpload}
        onFileSelect={onFileSelect}
        selectedFiles={selectedFiles}
        timelineProjects={{
          selected: timelineProjects?.selected,
          onSave: timelineProjects?.onSave,
          onLoad: timelineProjects?.onLoad,
          onDelete: timelineProjects?.onDelete
        }}
      />
      {children}
    </Box>
  );
};

export default MainLayout;