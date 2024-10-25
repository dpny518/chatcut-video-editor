// src/components/Viewers/TimelineViewerSection.js
import React from 'react';
import { Paper } from '@mui/material';
import TimelineViewer from './TimelineViewer';
const TimelineViewerSection = ({ clips }) => {
  return (
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TimelineViewer clips={clips} />
    </Paper>
  );
};
export default TimelineViewerSection;