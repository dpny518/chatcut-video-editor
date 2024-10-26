// src/components/Viewers/TranscriptViewerSection.js
import React from 'react';
import { Paper } from '@mui/material';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';
const TimelineTranscriptViewerSection = ({ selectedClip, onAddToTimeline }) => {
  return (
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TimelineTranscriptViewer
        selectedClip={selectedClip}
        onAddToTimeline={onAddToTimeline}
      />
    </Paper>
  );
};
export default TimelineTranscriptViewerSection;