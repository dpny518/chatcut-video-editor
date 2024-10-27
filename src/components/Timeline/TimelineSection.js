// src/components/Timeline/TimelineSection.js
import React from 'react';
import { Box } from '@mui/material';
import Timeline from './index';
const TimelineSection = ({ clips, onClipsChange, transcripts }) => {
  console.log('TimelineSection received transcripts:', transcripts);
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
        transcripts={transcripts}
      />
    </Box>
  );
};
export default TimelineSection