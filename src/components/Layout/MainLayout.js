import React from 'react';
import { Box, IconButton } from '@mui/material';
import MediaSidebar from '../Media/MediaSidebar';
import Sidebar from './Sidebar';

const MainLayout = ({ 
  mediaFiles = [], 
  selectedBinClip,
  onFileUpload, 
  onFileSelect,
  timelineProjects,
  children,
  themeMode,
  onThemeChange,
  currentView,
  onViewChange
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        onPageChange={onViewChange}
        currentPage={currentView}
        themeMode={themeMode}
        onThemeChange={onThemeChange}
      />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <MediaSidebar 
          files={mediaFiles}
          onFileUpload={onFileUpload}
          onFileSelect={onFileSelect}
          selectedFile={selectedBinClip}
          timelineProjects={timelineProjects}
        />
        <Box sx={{ flexGrow: 1, p: 2, position: 'relative' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;