// src/components/Viewers/TranscriptViewerSection.js
import React from 'react';
import { Paper, Box, Alert, Typography } from '@mui/material';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';
import useTimelineStore from '../../stores/timelineStore';
import useTranscriptStore from '../../stores/transcriptStore';

const TranscriptViewerSection = () => {
  // Get state from stores
  const { 
    timelineTranscripts,
    searchResults,
    searchQuery
  } = useTranscriptStore(state => ({
    timelineTranscripts: state.timelineTranscripts,
    searchResults: state.searchResults,
    searchQuery: state.searchQuery
  }));

  const {
    clips,
    selectedClipId
  } = useTimelineStore(state => ({
    clips: state.clips,
    selectedClipId: state.selectedClipId
  }));

  // Early return for no clips
  if (clips.length === 0) {
    return (
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
    );
  }

  // Early return for no transcripts
  if (!timelineTranscripts.size) {
    return (
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
    );
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
      {/* Search Results Summary (if search is active) */}
      {searchQuery && (
        <Box sx={{ 
          p: 1, 
          bgcolor: 'background.default',
          borderRadius: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            {searchResults.length} matches found for "{searchQuery}"
          </Typography>
        </Box>
      )}

      {/* Main Transcript Viewer */}
      <TimelineTranscriptViewer />

      {/* Selected Clip Info (if any clip is selected) */}
      {selectedClipId && (
        <Box sx={{ 
          mt: 'auto',
          pt: 1,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            Currently viewing: {clips.find(c => c.id === selectedClipId)?.name}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TranscriptViewerSection;