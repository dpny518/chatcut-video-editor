// src/components/Timeline/TimelineSection.js
import React from 'react';
import { Box } from '@mui/material';
import Timeline from './index';

const TimelineSection = ({ timeline, onClipAdd, onCreateReference, references }) => {
  console.log('TimelineSection rendered with:', {
    timeline,
    references,
    hasTimeline: Boolean(timeline),
    clipCount: timeline?.clips?.length
  });

  // This is how we used to pass clips in the single timeline version
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
        clips={timeline?.clips || []}  // Pass clips directly like before
        onClipsChange={(newClips) => {
          if (timeline && onClipAdd) {
            onClipAdd({
              ...timeline,
              clips: newClips
            });
          }
        }}
        selectedClipId={timeline?.metadata?.selectedClipId}
        onClipSelect={(clipId) => {
          if (timeline && onClipAdd) {
            onClipAdd({
              ...timeline,
              metadata: {
                ...timeline.metadata,
                selectedClipId: clipId
              }
            });
          }
        }}
      />
    </Box>
  );
};

export default TimelineSection;