import React from 'react';
import { Box } from '@mui/material';
import ReactPlayer from 'react-player';

const TRANSITION_DURATION = 500;

export const TimelineTransitionPlayer = ({ 
  clip, 
  playbackState = {}, // Provide a default empty object
  onProgress,
  zIndex 
}) => {
  // Destructure opacity and playing with default values
  const { opacity = 0, playing = false } = playbackState;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: opacity, // Now this will default to 0 if undefined
        transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
        zIndex
      }}
    >
      <ReactPlayer
        url={clip.url}
        playing={playing} // Now this will default to false if undefined
        width="100%"
        height="100%"
        progressInterval={100}
        onProgress={onProgress}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous"
            }
          }
        }}
      />
    </Box>
  );
};
