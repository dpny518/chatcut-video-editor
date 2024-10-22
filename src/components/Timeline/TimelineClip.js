// src/components/Timeline/TimelineClip.js
import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const TimelineClip = ({ 
  clip, 
  action, 
  isSelected, 
  onSelect 
}) => {
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && clip.file) {
      // Clean up previous URL
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      // Create new URL
      videoUrlRef.current = URL.createObjectURL(clip.file);
      videoRef.current.src = videoUrlRef.current;
    }

    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, [clip.file]);

  // Update video frame when original start time changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoad = () => {
      // Use the original video timing, not the timeline position
      video.currentTime = clip.originalStart || clip.startTime;
    };

    video.addEventListener('loadedmetadata', handleLoad);
    
    // Also update currentTime immediately if video is already loaded
    if (video.readyState >= 2) {
      video.currentTime = clip.originalStart || clip.startTime;
    }

    return () => video.removeEventListener('loadedmetadata', handleLoad);
  }, [clip.originalStart, clip.startTime]);

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