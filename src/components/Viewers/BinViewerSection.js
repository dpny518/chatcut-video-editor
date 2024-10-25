// src/components/Viewers/BinViewerSection.js
import React from 'react';
import { Paper } from '@mui/material';
import BinViewer from './BinViewer';
const BinViewerSection = ({ selectedClip, onAddToTimeline }) => {
  return (
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <BinViewer
        selectedClip={selectedClip}
        onAddToTimeline={onAddToTimeline}
      />
    </Paper>
  );
};
export default BinViewerSection;