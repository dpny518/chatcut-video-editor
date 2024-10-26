import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardHeader,
  CardContent, 
  Button, 
  IconButton,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import AddIcon from '@mui/icons-material/Add';

const TimelineTranscriptViewer = ({ 
  selectedClip,
  transcriptData, 
  onClipSelect,
  onAddToTimeline,
}) => {
  const [viewMode, setViewMode] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selection, setSelection] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && selectedClip?.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(selectedClip.file);
      videoRef.current.src = videoUrlRef.current;
    }
  }, [selectedClip]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

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
    if (!selection || !selectedClip) return;

    const clipData = {
      id: `clip-${Date.now()}`,
      file: selectedClip.file,
      name: selectedClip.file.name,
      startTime: selection.start,
      endTime: selection.end,
      duration: selection.end - selection.start,
      source: {
        startTime: 0,
        endTime: videoRef.current?.duration || 0,
        duration: videoRef.current?.duration || 0
      },
      transcript: selection.text
    };

    onAddToTimeline?.(clipData);
    setSelection(null);
  }, [selection, selectedClip, onAddToTimeline]);

  const renderTranscript = () => {
    if (!transcriptData?.transcription) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          p: 2 
        }}>
          <Typography variant="body2" color="text.secondary">
            No transcript data available
          </Typography>
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
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
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
                transition: 'background-color 0.2s',
                bgcolor: currentTime >= word.start && currentTime < word.end 
                  ? 'primary.main' 
                  : 'transparent',
                color: currentTime >= word.start && currentTime < word.end 
                  ? 'primary.contrastText' 
                  : 'inherit',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {word.word}{' '}
            </Box>
          ))}
        </Typography>
      </Box>
    ));
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          p: 1,
          pb: 0
        }}
        title={
          <Tabs 
            value={viewMode} 
            onChange={(e, newValue) => setViewMode(newValue)}
            sx={{ minHeight: 48 }}
          >
            <Tab 
              icon={<VideoFileIcon />} 
              iconPosition="start"
              label="Video" 
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<TextSnippetIcon />} 
              iconPosition="start"
              label="Transcript"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        }
      />
      
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {viewMode === 0 ? (
          <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'black' }}>
            {selectedClip ? (
              <>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%' }}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                  }}
                  onClick={handleTogglePlay}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                p: 2 
              }}>
                <Typography variant="body2" color="text.secondary">
                  No clip selected
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box 
            sx={{ 
              flexGrow: 1,
              overflowY: 'auto',
              p: 2
            }}
            onMouseUp={handleTextSelection}
          >
            {renderTranscript()}
          </Box>
        )}
        
        {selection && (
          <Paper 
            elevation={3}
            sx={{ 
              p: 2,
              m: 2,
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 500 }}>Selected: </Box>
              {selection.start.toFixed(2)}s - {selection.end.toFixed(2)}s
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddToTimeline}
              sx={{ minWidth: 120 }}
            >
              Add to Timeline
            </Button>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineTranscriptViewer;