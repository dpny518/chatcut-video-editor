// src/components/Timeline/TimelineDebug.js
import React from 'react';
import { Box, Typography } from '@mui/material';
const TimelineDebug = ({ timelineClips, selectedBinClip }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Box 
      sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'rgba(0,0,0,0.5)', 
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: '200px'
      }}
    >
      <Typography variant="caption" component="pre" sx={{ color: 'grey.500' }}>
        {JSON.stringify(
          {
            timelineClips,
            selectedBinClip: selectedBinClip ? {
              ...selectedBinClip,
              file: `File: ${selectedBinClip.file.name}`
            } : null
          }, 
          null, 
          2
        )}
      </Typography>
    </Box>
  );
};
export default TimelineDebug;