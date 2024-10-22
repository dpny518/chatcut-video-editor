// src/components/Timeline/TimelineClip.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatTime } from '../../utils/formatters';

const TimelineClip = ({ 
  clip, 
  action, 
  isSelected, 
  onSelect 
}) => {
  if (!clip) return null;

  const duration = action.end - action.start;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(action.id);
      }}
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: isSelected ? 'primary.main' : '#3c3c3c',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isSelected ? 'primary.dark' : '#4c4c4c',
        },
        overflow: 'hidden',
        // Optional: add a subtle border
        border: isSelected ? '1px solid rgba(255,255,255,0.2)' : 'none',
        // Optional: add a subtle shadow
        boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mr: 1
        }}
      >
        {clip.name || 'Untitled'}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          flexShrink: 0
        }}
      >
        {formatTime(duration)}
      </Typography>
    </Box>
  );
};

export default TimelineClip;