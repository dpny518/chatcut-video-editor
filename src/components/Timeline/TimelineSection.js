// src/components/Timeline/TimelineSection.js
import React from 'react';
import { Box } from '@mui/material';
import Timeline from './index';
const TimelineSection = ({ clips, onClipsChange,timelineRows,setTimelineRows }) => {
  return (
    <Box sx={{ 
      width: '100%',
      height: '150px',
      bgcolor: '#1a1a1a',
      mb: 2,
      '.timeline-editor': {
        width: '100% !important'
      }
    }}>
      <Timeline 
        clips={clips}
        onClipsChange={onClipsChange}
        timelineRows={timelineRows}
        setTimelineRows={setTimelineRows}
      />
    </Box>
  );
};
export default TimelineSection