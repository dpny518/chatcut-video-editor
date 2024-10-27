import React, { useMemo } from 'react'; // Added useMemo import
import { Box } from '@mui/material';
import Timeline from './index';
import { shallow } from 'zustand/shallow'; // Added for comparison if needed

const TimelineSection = ({ clips, onClipsChange, transcripts }) => {
  // Memoize the processed transcripts
  const processedTranscripts = useMemo(() => {
    if (!transcripts || transcripts.size === 0) return new Map();
    return transcripts;
  }, [transcripts]);

  // Memoize the Timeline component props
  const timelineProps = useMemo(() => ({
    clips,
    onClipsChange,
    transcripts: processedTranscripts
  }), [clips, onClipsChange, processedTranscripts]);

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
      <Timeline {...timelineProps} />
    </Box>
  );
};

// Memoize the entire component with proper comparison
export default React.memo(TimelineSection, (prevProps, nextProps) => {
  // Use Object.is for strict equality comparison
  const clipsEqual = Object.is(prevProps.clips, nextProps.clips);
  const onClipsChangeEqual = Object.is(prevProps.onClipsChange, nextProps.onClipsChange);
  
  // For Map comparison
  const transcriptsEqual = prevProps.transcripts === nextProps.transcripts || 
    (prevProps.transcripts?.size === nextProps.transcripts?.size && 
     Array.from(prevProps.transcripts?.entries() || []).every(([key, value]) => 
       nextProps.transcripts?.get(key) === value
     ));

  return clipsEqual && onClipsChangeEqual && transcriptsEqual;
});