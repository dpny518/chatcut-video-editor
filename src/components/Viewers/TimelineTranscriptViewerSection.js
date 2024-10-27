import React, { useMemo } from 'react';
import { Paper, Box, Alert, Typography } from '@mui/material';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';
import useTimelineStore from '../../stores/timelineStore';
import useTranscriptStore from '../../stores/transcriptStore';
import { shallow } from 'zustand/shallow';

const TranscriptViewerSection = () => {
  // Split selectors to prevent unnecessary re-renders
  const { timelineTranscripts } = useTranscriptStore(
    state => ({ 
      timelineTranscripts: state.timelineTranscripts 
    }), 
    shallow
  );

  const searchState = useTranscriptStore(
    state => ({ 
      searchResults: state.searchState.results,
      searchQuery: state.searchState.query 
    }), 
    shallow
  );

  const timelineState = useTimelineStore(
    state => ({
      clips: state.clips,
      selectedClipId: state.selectedClipId
    }), 
    shallow
  );

  // Memoize selected clip info
  const selectedClip = useMemo(() => 
    timelineState.clips.find(c => c.id === timelineState.selectedClipId),
    [timelineState.clips, timelineState.selectedClipId]
  );

  // Early returns with memoized components
  const emptyClipsView = useMemo(() => (
    <Paper sx={{ 
      flex: 1, 
      p: 2, 
      bgcolor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Alert severity="info">
        Add clips to the timeline to view transcripts
      </Alert>
    </Paper>
  ), []);

  const emptyTranscriptsView = useMemo(() => (
    <Paper sx={{ 
      flex: 1, 
      p: 2, 
      bgcolor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Alert severity="info">
        No transcript data available for the current clips
      </Alert>
    </Paper>
  ), []);

  if (timelineState.clips.length === 0) {
    return emptyClipsView;
  }

  if (!timelineTranscripts.size) {
    return emptyTranscriptsView;
  }

  return (
    <Paper 
      sx={{ 
        flex: 1, 
        p: 2, 
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1
      }}
    >
      {searchState.searchQuery && (
        <Box sx={{ 
          p: 1, 
          bgcolor: 'background.default',
          borderRadius: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            {searchState.searchResults.length} matches found for "{searchState.searchQuery}"
          </Typography>
        </Box>
      )}

      <TimelineTranscriptViewer />

      {selectedClip && (
        <Box sx={{ 
          mt: 'auto',
          pt: 1,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            Currently viewing: {selectedClip.name}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(TranscriptViewerSection);