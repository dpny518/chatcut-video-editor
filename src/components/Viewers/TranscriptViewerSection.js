import React from 'react';
import { Paper } from '@mui/material';
import TranscriptViewer from './TranscriptViewer';

const TranscriptViewerSection = ({ selectedClip, transcriptData, onAddToTimeline }) => {
  return (
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TranscriptViewer
        selectedClip={selectedClip}  // Pass the whole selectedClip object
        transcriptData={transcriptData}
        onAddToTimeline={onAddToTimeline}
      />
    </Paper>
  );
};

export default TranscriptViewerSection;