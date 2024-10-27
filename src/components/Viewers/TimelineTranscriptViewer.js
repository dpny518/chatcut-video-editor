import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Button, 
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';

const TimelineTranscriptViewer = ({ 
  selectedClip,
  transcriptData, 
  viewMode // Now controlled by parent
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selection, setSelection] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  console.log('TimelineTranscriptViewer received:', {
    selectedClip,
    transcriptData,
    viewMode
  });
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

  const renderTranscript = () => {
    // First, check if we have a Map with data
    if (!transcriptData || !(transcriptData instanceof Map)) {
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

    // Get the first transcript value from the Map
    const transcriptEntry = transcriptData.values().next().value;
    
    if (!transcriptEntry?.transcription) {
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

    return transcriptEntry.transcription.map((item, index) => (
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

  const renderContent = () => {
    if (viewMode === 'video') {
      return (
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
      );
    }
    
    return (
      <Box 
        sx={{ 
          flexGrow: 1,
          overflowY: 'auto',
          p: 2
        }}
      >
        {renderTranscript()}
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
        
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
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineTranscriptViewer;