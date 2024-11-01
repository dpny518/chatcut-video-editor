import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box,
  Card, 
  CardContent, 
  Button, 
  Typography,
  Paper,
  IconButton 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';  

const TranscriptViewer = ({ 
  selectedClips = [],
  transcriptData = [], 
  onAddToTimeline,
  timelineClips = [],
  sx
}) => {
  const [selections, setSelections] = useState([]);
  const videoRefs = useRef(new Map());
  const videoUrlRefs = useRef(new Map());

  useEffect(() => {
    if (!Array.isArray(transcriptData)) return;

    transcriptData.forEach(({ clipId }) => {
      const clip = selectedClips.find(c => c.id === clipId);
      if (clip && !videoUrlRefs.current.has(clipId)) {
        videoUrlRefs.current.set(clipId, URL.createObjectURL(clip.file));
        
        const video = document.createElement('video');
        video.src = videoUrlRefs.current.get(clipId);
        videoRefs.current.set(clipId, video);
      }
    });

    return () => {
      videoUrlRefs.current.forEach(url => URL.revokeObjectURL(url));
      videoUrlRefs.current.clear();
      videoRefs.current.clear();
    };
  }, [selectedClips, transcriptData]);

  const handleRemoveSelection = useCallback((indexToRemove) => {
    setSelections(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleWordSelection = useCallback((startWord, endWord, text, clipId) => {
    setSelections(prev => [...prev, {
      clipId,
      start: startWord.start,
      end: endWord.end,
      text,
      startWord,
      endWord
    }]);
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer.parentNode;
    const endNode = range.endContainer.parentNode;

    if (startNode.hasAttribute('data-time') && endNode.hasAttribute('data-time')) {
      const clipId = startNode.getAttribute('data-clip-id');
      const startTime = parseFloat(startNode.getAttribute('data-time'));
      const endTime = parseFloat(endNode.getAttribute('data-time-end'));

      const clipData = transcriptData.find(t => t.clipId === clipId);
      if (!clipData) return;

      const allWords = clipData.transcript.transcription
        .flatMap(item => item.words)
        .filter(word => word.start >= startTime && word.end <= endTime);

      if (allWords.length > 0) {
        const startWord = allWords[0];
        const endWord = allWords[allWords.length - 1];
        handleWordSelection(startWord, endWord, selection.toString(), clipId);
      }
    }
  }, [transcriptData, handleWordSelection]);

  const findTimelineEndPosition = useCallback((existingClips) => {
    if (!existingClips?.length) return 0;
    const maxEnd = Math.max(...existingClips.map(clip => clip.metadata?.timeline?.end || 0));
    return maxEnd;
  }, []);

  const handleAddToTimeline = useCallback(() => {
    if (!selections.length || !selectedClips.length) return;

    let currentTimelinePosition = findTimelineEndPosition(timelineClips);

    // Add each selection in sequence
    selections.forEach(selection => {
      const selectedClip = selectedClips.find(clip => clip.id === selection.clipId);
      if (!selectedClip) return;

      const video = videoRefs.current.get(selection.clipId);
      if (!video) return;

      const clipStart = selection.start;
      const clipEnd = selection.end;
      const timelineDuration = clipEnd - clipStart;
      
      // Add small gap if not first clip
      if (currentTimelinePosition > 0) {
        currentTimelinePosition += 0.0;
      }

      const clipData = {
        id: `clip-${Date.now()}-${selectedClip.id}`,
        file: selectedClip.file,
        name: selectedClip.name,
        startTime: clipStart,
        endTime: clipEnd,
        duration: timelineDuration,
        source: {
          startTime: 0,
          endTime: video.duration,
          duration: video.duration
        },
        transcript: selection.text,
        metadata: {
          timeline: {
            start: currentTimelinePosition,
            end: currentTimelinePosition + timelineDuration,
            duration: timelineDuration,
            track: 0
          },
          playback: {
            start: clipStart,
            end: clipEnd,
            duration: timelineDuration
          }
        },
        selectionInfo: {
          text: selection.text,
          startWord: selection.startWord,
          endWord: selection.endWord,
          timeRange: {
            start: clipStart,
            end: clipEnd
          }
        }
      };

      onAddToTimeline?.(clipData);
      currentTimelinePosition += timelineDuration;
    });

    setSelections([]); // Clear selections after adding to timeline
  }, [selections, selectedClips, timelineClips, onAddToTimeline, findTimelineEndPosition]);

  const renderTranscript = () => {
    if (!Array.isArray(transcriptData) || transcriptData.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary' 
        }}>
          No transcript data available
        </Box>
      );
    }

    return transcriptData.map(({ clipId, transcript }) => {
      const clip = selectedClips.find(c => c.id === clipId);
      if (!clip || !transcript?.transcription) return null;

      return (
        <Box key={clipId} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {clip.name}
          </Typography>
          {transcript.transcription.map((item, index) => (
            <Box key={`segment-${index}`} sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                color="primary"
                sx={{ mb: 0.5, fontWeight: 500 }}
              >
                Speaker {item.segment.speaker}
              </Typography>
              <Box sx={{ fontSize: '0.875rem', lineHeight: 1.75 }}>
                {item.words.map((word, wordIndex) => {
                  const isSelected = selections.some(sel => 
                    sel.clipId === clipId && 
                    word.start >= sel.start && 
                    word.end <= sel.end
                  );

                  return (
                    <Box
                      component="span"
                      key={`word-${wordIndex}`}
                      data-clip-id={clipId}
                      data-time={word.start}
                      data-time-end={word.end}
                      sx={{
                        px: 0.5,
                        borderRadius: 0.5,
                        transition: 'background-color 0.2s',
                        bgcolor: isSelected ? 'primary.light' : 'transparent',
                        color: isSelected ? 'primary.contrastText' : 'inherit',
                      }}
                    >
                      {word.word}{' '}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      );
    });
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box 
          sx={{ 
            flexGrow: 1,
            height: 400,
            overflowY: 'auto',
            p: 2
          }}
          onMouseUp={handleTextSelection}
        >
          {renderTranscript()}
        </Box>

        {selections.length > 0 && (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      display: 'flex',
      borderTop: 1,
      borderColor: 'divider',
      bgcolor: 'background.default'
    }}
  >
    <Box sx={{ flexGrow: 1 }}>
      {selections.map((selection, index) => {
        const clipName = selectedClips.find(c => c.id === selection.clipId)?.name;
        return (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: index < selections.length - 1 ? 1 : 0 
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              <Box component="span" sx={{ fontWeight: 500 }}>Selection {index + 1}: </Box>
              {selection.start.toFixed(2)}s - {selection.end.toFixed(2)}s
              {clipName && (
                <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                  (from {clipName})
                </Box>
              )}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleRemoveSelection(index)}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}
    </Box>
    <Box sx={{ ml: 2, display: 'flex', alignItems: 'flex-start' }}>
      <Button
        variant="contained"
        onClick={handleAddToTimeline}
        startIcon={<AddIcon />}
      >
        Add to Timeline
      </Button>
    </Box>
  </Paper>
)}
      </CardContent>
    </Card>
  );
};

export default TranscriptViewer;