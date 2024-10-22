// src/components/Timeline/TimelineClip.js
import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const TimelineClip = ({ 
  clip, 
  action, 
  row, 
  isSelected, 
  onSelect 
}) => {
  const videoRef = useRef(null);

  // Set the correct frame when video metadata is loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoad = () => {
      // Set currentTime to clip's start time
      video.currentTime = clip.startTime;
    };

    video.addEventListener('loadedmetadata', handleLoad);
    return () => video.removeEventListener('loadedmetadata', handleLoad);
  }, [clip.startTime]);

  return (
    <Box
      onClick={() => onSelect?.(action.id)}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.main' : 'grey.800',
        borderRadius: 1,
        border: theme => `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.grey[700]}`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        '&:hover': {
          bgcolor: 'grey.700',
        }
      }}
    >
      {/* Thumbnail container */}
      <Box
        sx={{
          width: 80,
          height: '100%',
          flexShrink: 0,
          position: 'relative',
          bgcolor: 'black',
          overflow: 'hidden'
        }}
      >
        <video
          ref={videoRef}
          src={clip.file ? URL.createObjectURL(clip.file) : ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          muted
          playsInline
        />
      </Box>

      {/* Clip info */}
      <Box
        sx={{
          flex: 1,
          px: 1,
          overflow: 'hidden'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {clip.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'grey.400',
            fontSize: '0.7rem'
          }}
        >
          {(action.end - action.start).toFixed(1)}s
        </Typography>
      </Box>
    </Box>
  );
};

export default TimelineClip;