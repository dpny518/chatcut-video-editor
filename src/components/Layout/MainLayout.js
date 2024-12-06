import React from 'react';
import { Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
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
      <Sidebar onPageChange={onViewChange} currentPage={currentView} />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <MediaSidebar 
          files={mediaFiles}
          onFileUpload={onFileUpload}
          onFileSelect={onFileSelect}
          selectedFile={selectedBinClip}
          timelineProjects={timelineProjects}
        />
        <Box sx={{ flexGrow: 1, p: 2, position: 'relative' }}>
          <IconButton
            onClick={onThemeChange}
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
          >
            {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;