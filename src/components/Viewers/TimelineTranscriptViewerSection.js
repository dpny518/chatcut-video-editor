import React from 'react';
import { Paper } from '@mui/material';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';

const TimelineTranscriptViewerSection = ({ selectedClip, transcriptData }) => {
  return (
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TimelineTranscriptViewer
        selectedClip={selectedClip}  // Pass the whole selectedClip object
        transcriptData={transcriptData}
      />
    </Paper>
  );
};

export default TimelineTranscriptViewerSection;