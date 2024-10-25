// src/components/TimelineTransition/TimelineTransitionContainer.js
import React from 'react';
import { Box } from '@mui/material';
import { useTimelineTransition } from '../../hooks/useTimeline/useTimelineTransition';
import { TimelineTransitionPlayer } from './TimelineTransitionPlayer';

export const TimelineTransitionContainer = ({ 
  clips, 
  currentTime, 
  playing,
  onClipProgress 
}) => {
  const { 
    activeClips, 
    playbackStates 
  } = useTimelineTransition(clips, currentTime, playing);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {activeClips.map((clip, index) => (
        <TimelineTransitionPlayer
          key={clip.id}
          clip={clip}
          playbackState={playbackStates[clip.id]}
          zIndex={index}
          onProgress={(progress) => onClipProgress?.(clip.id, progress)}
        />
      ))}
    </Box>
  );
};