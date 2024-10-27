import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box,
  Card, 
  CardContent, 
  Button, 
  Typography,
  Paper,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import useMediaStore from '../../stores/mediaStore';

const TranscriptViewer = ({ sx }) => {
  // Get state and actions from store
  const {
    selectedFile,
    getTranscriptForFile,
    addToTimeline,
    setNotification
  } = useMediaStore(state => ({
    selectedFile: state.selectedFile,
    getTranscriptForFile: state.getTranscriptForFile,
    addToTimeline: state.addToTimeline,
    setNotification: state.setNotification
  }));

  // Local state
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

  // Get transcript data
  const transcriptData = getTranscriptForFile(selectedFile?.name);
  
  // Handle video source
  useEffect(() => {
    if (videoRef.current && selectedFile?.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(selectedFile.file);
      videoRef.current.src = videoUrlRef.current;
    }

    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, [selectedFile]);

  const handleWordClick = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer.parentNode;
    const endNode = range.endContainer.parentNode;

    if (startNode.hasAttribute('data-time') && endNode.hasAttribute('data-time')) {
      const start = parseFloat(startNode.getAttribute('data-time'));
      const end = parseFloat(endNode.getAttribute('data-time-end') || endNode.getAttribute('data-time'));
      
      setSelection({
        start,
        end,
        text: selection.toString()
      });
    }
  }, []);

  const handleAddToTimeline = useCallback(() => {
    if (!selection || !selectedFile) {
      setNotification('Missing required data for timeline clip', 'error');
      return;
    }
  
    const video = document.createElement('video');
    video.src = URL.createObjectURL(selectedFile.file);
  
    video.addEventListener('loadedmetadata', () => {
      const clipData = {
        id: `clip-${Date.now()}`,
        file: selectedFile.file,
        name: selectedFile.name,
        startTime: selection.start,
        endTime: selection.end,
        duration: selection.end - selection.start,
        source: {
          startTime: 0,
          endTime: video.duration,
          duration: video.duration
        },
        transcript: {
          text: selection.text,
          start: selection.start,
          end: selection.end
        }
      };
  
      video.src = '';
      URL.revokeObjectURL(video.src);
  
      addToTimeline(clipData);
      setNotification('Clip added to timeline', 'success');
      setSelection(null);
    });
  
    video.addEventListener('error', () => {
      setNotification('Error loading video metadata', 'error');
    });
  
  }, [selection, selectedFile, addToTimeline, setNotification]);

  const renderTranscript = useCallback(() => {
    if (!transcriptData?.transcription) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">
            No transcript data available for this video
          </Alert>
        </Box>
      );
    }

    return transcriptData.transcription.map((item, index) => (
      <Box key={`segment-${index}`} sx={{ mb: 2 }}>
        <Typography 
          variant="subtitle2" 
          color="primary"
          sx={{ mb: 0.5, fontWeight: 500 }}
        >
          Speaker {item.segment.speaker}
        </Typography>
        <Box 
          sx={{ 
            fontSize: '0.875rem', 
            lineHeight: 1.75,
            userSelect: 'text'  // Enable text selection
          }}
        >
          {item.words.map((word, wordIndex) => (
            <Box
              component="span"
              key={`word-${wordIndex}`}
              data-time={word.start}
              data-time-end={word.end}
              onClick={() => handleWordClick(word.start)}
              sx={{
                cursor: 'pointer',
                px: 0.5,
                borderRadius: 0.5,
                transition: 'all 0.2s',
                bgcolor: currentTime >= word.start && currentTime < word.end 
                  ? 'primary.main' 
                  : 'transparent',
                color: currentTime >= word.start && currentTime < word.end 
                  ? 'primary.contrastText' 
                  : 'inherit',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
                ...(selection && word.start >= selection.start && word.end <= selection.end && {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                })
              }}
            >
              {word.word}{' '}
            </Box>
          ))}
        </Box>
      </Box>
    ));
  }, [transcriptData, currentTime, selection, handleWordClick]);

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: 'none',
        ...sx 
      }}
    >
      <CardContent sx={{ 
        p: 0, 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        '&:last-child': { pb: 0 }
      }}>
        <Box 
          sx={{ 
            flexGrow: 1,
            height: 400,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.paper'
          }}
          onMouseUp={handleTextSelection}
        >
          {renderTranscript()}
        </Box>

        {selection && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Box>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                Selected Range
              </Typography>
              <Typography variant="body2">
                {selection.start.toFixed(2)}s - {selection.end.toFixed(2)}s
                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({(selection.end - selection.start).toFixed(2)}s)
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
      </CardContent>

      {/* Hidden video element for duration calculation */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        preload="metadata"
      />
    </Card>
  );
};

export default TranscriptViewer;