import React from 'react';
import { Paper } from '@mui/material';
import TranscriptViewer from './TranscriptViewer';

const TranscriptViewerSection = ({ selectedClip, transcriptData, onAddToTimeline }) => {
    useEffect(() => {
        console.log('TranscriptViewerSection props updated:', {
          selectedClip,
          transcriptData,
        });
      }, [selectedClip, transcriptData]);
    
  return (
    
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TranscriptViewer
        key={selectedClip?.id}
        selectedClip={selectedClip}  // Pass the whole selectedClip object
        transcriptData={transcriptData}
        onAddToTimeline={onAddToTimeline}
      />
    </Paper>
  );
};

export default TranscriptViewerSection;