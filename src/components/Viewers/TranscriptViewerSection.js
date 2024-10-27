import React from 'react';
import { Box, Paper, Button, Typography, Alert } from '@mui/material';
import TranscriptViewer from './TranscriptViewer';
import AddIcon from '@mui/icons-material/Add';
import useMediaStore from '../../stores/mediaStore';

const TranscriptViewerSection = () => {
  // Get state and actions from store
  const {
    selectedFile,
    transcriptSelection,
    addToTimeline,
    getTranscriptForFile,
    setNotification,
    clearTranscriptSelection
  } = useMediaStore(state => ({
    selectedFile: state.selectedFile,
    transcriptSelection: state.transcriptSelection,
    addToTimeline: state.addToTimeline,
    getTranscriptForFile: state.getTranscriptForFile,
    setNotification: state.setNotification,
    clearTranscriptSelection: state.clearTranscriptSelection
  }));

  // Get transcript data for the selected file
  const transcriptData = selectedFile 
    ? getTranscriptForFile(selectedFile.name)
    : null;

  const handleAddToTimeline = () => {
    if (!selectedFile || !transcriptSelection) {
      setNotification('No selection to add to timeline', 'error');
      return;
    }

    const clipData = {
      id: `clip-${Date.now()}`,
      file: selectedFile.file,
      name: selectedFile.name,
      startTime: transcriptSelection.start,
      endTime: transcriptSelection.end,
      duration: transcriptSelection.end - transcriptSelection.start,
      transcript: {
        text: transcriptSelection.text,
        start: transcriptSelection.start,
        end: transcriptSelection.end
      }
    };

    addToTimeline(clipData);
    setNotification('Added selection to timeline', 'success');
    clearTranscriptSelection();
  };

  if (!selectedFile) {
    return (
      <Paper sx={{ 
        flex: 1, 
        p: 2, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="info">
          Select a video file to view its transcript
        </Alert>
      </Paper>
    );
  }

  if (!transcriptData) {
    return (
      <Paper sx={{ 
        flex: 1, 
        p: 2, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="warning">
          No transcript found for {selectedFile.name}
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
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Transcript: {selectedFile.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Select text to add to timeline
        </Typography>
      </Box>

      <TranscriptViewer
        sx={{ 
          flexGrow: 1,
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'hidden'
        }}
      />

      {transcriptSelection && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            mt: 2
          }}
        >
          <Box>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              Selected Range
            </Typography>
            <Typography variant="body2">
              {transcriptSelection.start.toFixed(2)}s - {transcriptSelection.end.toFixed(2)}s
              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                ({(transcriptSelection.end - transcriptSelection.start).toFixed(2)}s)
              </Typography>
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleAddToTimeline}
            startIcon={<AddIcon />}
            size="small"
          >
            Add to Timeline
          </Button>
        </Paper>
      )}
    </Paper>
  );
};

export default TranscriptViewerSection;