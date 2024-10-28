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
  const saturation = 65;
  
  for (let i = 0; i < count; i++) {
    const hue = (i * 137.508) % 360;
    colors.push({
      light: `hsl(${hue}, ${saturation}%, 60%)`,
      dark: `hsl(${hue}, ${saturation}%, 45%)`,
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
  timelineState
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
  const sortedClips = React.useMemo(() => {
    return [...timelineState.clips].sort((a, b) => {
      const aStart = a.metadata?.timeline?.start || 0;
      const bStart = b.metadata?.timeline?.start || 0;
      return aStart - bStart;
    });
  }, [timelineState.clips]);

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

  const renderClipsList = () => (
    <List sx={{ borderBottom: 1, borderColor: 'divider' }}>
      {sortedClips.map((clip, index) => {
        const timeline = clip.metadata?.timeline || {};
        const playback = clip.metadata?.playback || {};
        return (
          <ListItem 
            key={clip.id}
            button
            selected={index === currentClipIndex}
            onClick={() => handleClipSelect(index)}
          >
            <ListItemText
              primary={`Clip ${index + 1}`}
              secondary={`Timeline: ${timeline.start?.toFixed(1)}s - ${timeline.end?.toFixed(1)}s | Source: ${playback.start?.toFixed(1)}s - ${playback.end?.toFixed(1)}s`}
            />
          </ListItem>
        );
      })}
    </List>
  );

  const renderTranscript = () => {
    if (!transcriptData || !(transcriptData instanceof Map)) {
      return <Typography>No transcript data available</Typography>;
    }

    const transcriptEntry = Array.from(transcriptData.values())[0];
    if (!transcriptEntry?.transcription) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sortedClips.map((clip, clipIndex) => {
          const timeline = clip.metadata?.timeline || {};
          const playback = clip.metadata?.playback || {};
          const clipColor = clipColors[clipIndex];
          const isCurrentClip = clipIndex === currentClipIndex;

          // Filter words that belong to this clip's playback range
          const clipWords = {};
          transcriptEntry.transcription.forEach(segment => {
            const speakerWords = segment.words.filter(word => 
              word.start >= playback.start && word.end <= playback.end
            );
            
            if (speakerWords.length > 0) {
              if (!clipWords[segment.segment.speaker]) {
                clipWords[segment.segment.speaker] = [];
              }
              clipWords[segment.segment.speaker].push(...speakerWords);
            }
          });

          if (Object.keys(clipWords).length === 0) return null;

          return (
            <Paper
              key={clip.id}
              elevation={2}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: 4,
                borderLeftColor: clipColor.light
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                Clip {clipIndex + 1}: Timeline [{timeline.start?.toFixed(1)}s - {timeline.end?.toFixed(1)}s]
                {' '}| Source [{playback.start?.toFixed(1)}s - {playback.end?.toFixed(1)}s]
              </Typography>

              {Object.entries(clipWords).map(([speaker, words]) => (
                <Box key={`${clip.id}-${speaker}`} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
                    Speaker {speaker}
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                    {words.map((word, wordIndex) => {
                      const adjustedTime = word.start - playback.start;
                      const isCurrentWord = isCurrentClip && 
                        currentTime >= adjustedTime && 
                        currentTime < (adjustedTime + (word.end - word.start));

                      return (
                        <Box
                          component="span"
                          key={`${word.word}-${wordIndex}`}
                          onClick={() => videoRef.current && (videoRef.current.currentTime = word.start)}
                          sx={{
                            cursor: 'pointer',
                            px: 0.5,
                            py: 0.25,
                            mx: 0.25,
                            borderRadius: 1,
                            transition: 'all 0.2s ease',
                            bgcolor: isCurrentWord ? clipColor.dark : clipColor.light,
                            color: isCurrentWord ? clipColor.textLight : clipColor.textDark,
                            '&:hover': {
                              bgcolor: clipColor.dark,
                              color: clipColor.textLight
                            }
                          }}
                        >
                          {word.word}{' '}
                        </Box>
                      );
                    })}
                  </Typography>
                </Box>
              ))}
            </Paper>
          );
        })}
      </Box>
    );
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
            <Typography variant="body2" color="text.secondary">
              No clip selected
            </Typography>
          )}
        </Box>
      );
    }
    
    return (
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
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