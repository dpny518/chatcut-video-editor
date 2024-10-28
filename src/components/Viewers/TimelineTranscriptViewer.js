import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

const generateDistinctColors = (count) => {
    const colors = [];
    const saturation = 65; // Keep saturation constant for consistency
    
    for (let i = 0; i < count; i++) {
      // Use golden ratio to spread hues evenly
      const hue = (i * 137.508) % 360; // Golden angle in degrees
      
      // Create two shades for each color: light and dark
      colors.push({
        light: `hsl(${hue}, ${saturation}%, 60%)`,
        dark: `hsl(${hue}, ${saturation}%, 45%)`,
        // Add text colors that ensure readability
        textLight: `hsl(${hue}, ${saturation}%, 95%)`,
        textDark: `hsl(${hue}, ${saturation}%, 15%)`
      });
    }
    return colors;
  };

const TimelineTranscriptViewer = ({ 
  clips,
  transcriptData, 
  viewMode,
  timelineState // Add timelineState prop
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selection, setSelection] = useState(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

    // Generate colors based on number of clips
    const clipColors = React.useMemo(() => 
        generateDistinctColors(timelineState.clips.length), 
        [timelineState.clips.length]
      );

  // Sort clips by timeline position
  const sortedClips = [...clips].sort((a, b) => {
    const aStart = a.metadata?.timeline?.start || 0;
    const bStart = b.metadata?.timeline?.start || 0;
    return aStart - bStart;
  });

  console.log('TimelineTranscriptViewer received:', {
    clips: sortedClips,
    transcriptData,
    viewMode,
    timelineState
  });

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && sortedClips[currentClipIndex]?.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(sortedClips[currentClipIndex].file);
      videoRef.current.src = videoUrlRef.current;
    }
  }, [currentClipIndex, sortedClips]);

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

  const handleClipSelect = useCallback((index) => {
    setCurrentClipIndex(index);
    setSelection(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  const handleWordClick = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setSelection({
        start: time,
        end: time + 0.5
      });
    }
  }, []);

  const renderClipsList = () => (
    <List sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {timelineState.clips.map((clip, index) => {
        return (
          <ListItem 
            key={clip.id}
            button
            selected={index === currentClipIndex}
            onClick={() => handleClipSelect(index)}
          >
            <ListItemText
              primary={`Clip ${index + 1}`}
              secondary={`Timeline: ${clip.startTime?.toFixed(1)}s - ${clip.endTime?.toFixed(1)}s | Playback: ${clip.startTime?.toFixed(1)}s - ${clip.endTime?.toFixed(1)}s`}
            />
          </ListItem>
        );
      })}
    </List>
  );
  
  // Update the renderTranscript function's word mapping section
const renderTranscript = () => {
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

  // Get transcript data from any clip since they're all from the same video
  const transcriptEntries = Array.from(transcriptData.values());
  const transcriptEntry = transcriptEntries[0];
  
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

  // Function to check if word is in any clip's range
  const getClipIndex = (word) => {
    return timelineState.clips.findIndex(clip => 
      word.start >= clip.startTime && word.end <= clip.endTime
    );
  };

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
        {item.words.map((word, wordIndex) => {
          const clipIndex = getClipIndex(word);
          const isInAnyClip = clipIndex !== -1;
          const clipColor = isInAnyClip ? clipColors[clipIndex] : null;
          const isInCurrentClip = clipIndex === currentClipIndex;
          
          const currentClip = timelineState.clips[currentClipIndex];
          const adjustedStart = isInCurrentClip ? word.start - currentClip.startTime : word.start;
          const adjustedEnd = isInCurrentClip ? word.end - currentClip.startTime : word.end;

          return (
            <Box
              component="span"
              key={`word-${wordIndex}`}
              onClick={() => isInAnyClip && handleWordClick(word.start)}
              sx={{
                cursor: isInAnyClip ? 'pointer' : 'not-allowed',
                px: 0.5,
                py: 0.25,
                mx: 0.25,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                bgcolor: isInAnyClip 
                  ? (isInCurrentClip && currentTime >= adjustedStart && currentTime < adjustedEnd
                      ? clipColor.dark 
                      : clipColor.light)
                  : 'transparent',
                color: isInAnyClip 
                  ? (isInCurrentClip && currentTime >= adjustedStart && currentTime < adjustedEnd
                      ? clipColor.textLight
                      : clipColor.textDark)
                  : 'text.secondary',
                '&:hover': {
                  bgcolor: isInAnyClip 
                    ? clipColor.dark
                    : 'transparent',
                  color: isInAnyClip ? clipColor.textLight : 'text.secondary'
                }
              }}
            >
              {word.word}{' '}
            </Box>
          );
        })}
      </Typography>
    </Box>
  ));
};

  const renderContent = () => {
    if (viewMode === 'video') {
      return (
        <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'black' }}>
          {sortedClips[currentClipIndex] ? (
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
        {renderClipsList()}
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