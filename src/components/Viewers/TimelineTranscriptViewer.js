import React, { useCallback } from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import useTimelineStore from '../../stores/timelineStore';
import useTranscriptStore from '../../stores/transcriptStore';

const TimelineTranscriptViewer = () => {
  const { clips, playbackTime } = useTimelineStore(state => ({
    clips: state.clips,
    playbackTime: state.playbackTime
  }));

  const { 
    timelineTranscripts, 
    getTimelineTranscript,
    currentHighlight 
  } = useTranscriptStore(state => ({
    timelineTranscripts: state.timelineTranscripts,
    getTimelineTranscript: state.getTimelineTranscript,
    currentHighlight: state.currentHighlight
  }));

  const renderClipTranscript = useCallback((clip) => {
    const transcriptData = getTimelineTranscript(clip.id);

    if (!transcriptData) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          No transcript found for clip: {clip.name}
        </Alert>
      );
    }

    return transcriptData.map((segment, segmentIndex) => {
      const isCurrentSegment = segment.words.some(word => 
        playbackTime >= word.timelineStart && 
        playbackTime <= word.timelineEnd
      );

      return (
        <Box 
          key={`${clip.id}-segment-${segmentIndex}`} 
          sx={{ 
            mb: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: isCurrentSegment ? 'action.hover' : 'transparent'
          }}
        >
          <Typography 
            variant="subtitle2" 
            color="primary"
            sx={{ 
              mb: 0.5, 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Speaker {segment.segment.speaker}</span>
            {isCurrentSegment && (
              <Typography variant="caption" color="text.secondary">
                Current Segment
              </Typography>
            )}
          </Typography>
          <Box sx={{ 
            fontSize: '0.875rem', 
            lineHeight: 1.75,
            '& > span': {
              transition: 'all 0.2s'
            }
          }}>
            {segment.words.map((word, wordIndex) => (
              <Box
                component="span"
                key={`${clip.id}-word-${wordIndex}`}
                sx={{
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ...(playbackTime >= word.timelineStart && 
                     playbackTime <= word.timelineEnd && {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 500
                  }),
                  ...(currentHighlight?.word === word.word && {
                    bgcolor: 'secondary.main',
                    color: 'secondary.contrastText'
                  }),
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {word.word}{' '}
              </Box>
            ))}
          </Box>
        </Box>
      );
    });
  }, [getTimelineTranscript, playbackTime, currentHighlight]);

  // Show loading state if no transcripts
  if (!timelineTranscripts.size) {
    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: 'none'
      }}>
        <CardContent>
          <Alert severity="info">
            Waiting for transcript data...
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      border: 'none'
    }}>
      <CardContent sx={{ 
        p: 0, 
        flexGrow: 1, 
        overflowY: 'auto',
        '&:last-child': { pb: 0 }
      }}>
        {clips.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="info">
              No clips added to timeline yet
            </Alert>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {clips.map((clip) => (
              <Box 
                key={clip.id} 
                sx={{ 
                  mb: 3,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  color="primary.main" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 500,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{clip.name}</span>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontWeight: 400 }}
                  >
                    {clip.startTime.toFixed(2)}s - {clip.endTime.toFixed(2)}s
                  </Typography>
                </Typography>
                {renderClipTranscript(clip)}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineTranscriptViewer;