import {React, useEffect} from 'react';
import { Paper } from '@mui/material';
import TranscriptViewer from './TranscriptViewer';

const TranscriptViewerSection = ({ 
  clips,
  selectedClip,
  transcriptData, 
  onAddToTimeline,
  timelineRows,
  setTimelineRows,
  sx
}) => {
    useEffect(() => {
        console.log('TranscriptViewerSection props updated:', {
          selectedClip,
          transcriptData,
        });
      }, [selectedClip, transcriptData]);
    
  return (
    
    <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
      <TranscriptViewer
         clips={clips}
         selectedClip={selectedClip}
         transcriptData={transcriptData}
         onAddToTimeline={onAddToTimeline}
         timelineRows={timelineRows}
         setTimelineRows={setTimelineRows}
      />
    </Paper>
  );
};

export default TranscriptViewerSection;