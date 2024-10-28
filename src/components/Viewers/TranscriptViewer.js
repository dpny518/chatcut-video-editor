import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box,
  Card, 
  CardContent, 
  Button, 
  Typography,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const TranscriptViewer = ({ 
  selectedClip,
  transcriptData, 
  onAddToTimeline,
  timelineRows,
  setTimelineRows,
  sx
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  
  // Update useEffect to use selectedClip.file
  useEffect(() => {
    if (videoRef.current && selectedClip?.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(selectedClip.file);
      videoRef.current.src = videoUrlRef.current;
    }
  }, [selectedClip]);

  const handleWordSelection = useCallback((startWord, endWord, text) => {
    setSelection({
      start: startWord.start,
      end: endWord.end,
      text,
      startWord,
      endWord
    });
  }, []);



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
      const startTime = parseFloat(startNode.getAttribute('data-time'));
      const endTime = parseFloat(endNode.getAttribute('data-time-end'));
  
      // Find all words between start and end time
      const allWords = transcriptData.transcription
        .flatMap(item => item.words)
        .filter(word => word.start >= startTime && word.end <= endTime);

      if (allWords.length > 0) {
        const startWord = allWords[0];
        const endWord = allWords[allWords.length - 1];
        
        handleWordSelection(startWord, endWord, selection.toString());
      }
    }
  }, [transcriptData, handleWordSelection]);


  const handleAddToTimeline = useCallback(() => {
    if (!selection || !selectedClip) {
      console.warn('Missing required data for timeline clip', { selection, selectedClip });
      return;
    }
  
    // Create a video element to get duration
    const video = document.createElement('video');
    video.src = URL.createObjectURL(selectedClip.file);
  
    // Wait for metadata to load to get duration
    video.addEventListener('loadedmetadata', () => {
      const clipStart = selection.start;
      const clipEnd = selection.end;
      const timelineDuration = clipEnd - clipStart;
      
      // Find a suitable row for the new clip
      const findSuitableRow = (startTime, endTime) => {
        // First try to find an existing row where the clip can fit
        let rowIndex = timelineRows.findIndex(row => {
          // Check for overlaps with existing clips in this row
          const hasOverlap = row.clips.some(clip => {
            const clipTimelineStart = clip.metadata.timeline.start;
            const clipTimelineEnd = clip.metadata.timeline.end;
            return !(endTime <= clipTimelineStart || startTime >= clipTimelineEnd);
          });
          return !hasOverlap;
        });
    
        // If no suitable row found, create a new one
        if (rowIndex === -1) {
          rowIndex = timelineRows.length;
          setTimelineRows(prev => [...prev, { rowId: rowIndex, clips: [], lastEnd: 0 }]);
        }
    
        return rowIndex;
      };
    
      // Calculate where this clip should start in the timeline
      const timelineStart = timelineRows[0]?.lastEnd || 0;
      const timelineEnd = timelineStart + timelineDuration;
      
      // Find suitable row for the clip
      const rowIndex = findSuitableRow(timelineStart, timelineEnd);
      
      const clipData = {
        id: `clip-${Date.now()}`,
        file: selectedClip.file,
        name: selectedClip.file.name,
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
            start: timelineStart,
            end: timelineEnd,
            duration: timelineDuration,
            row: rowIndex // Include row information
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
  
      // Update the row's metadata
      setTimelineRows(prev => {
        const updated = [...prev];
        const targetRow = updated[rowIndex];
        targetRow.clips.push(clipData);
        targetRow.lastEnd = Math.max(targetRow.lastEnd, timelineEnd);
        return updated;
      });
  
      // Cleanup
      video.src = '';
      URL.revokeObjectURL(video.src);
  
      console.log('Adding clip from transcript selection:', {
        clipData,
        selection,
        timeline: clipData.metadata.timeline,
        playback: clipData.metadata.playback,
        rowIndex
      });
  
      onAddToTimeline?.(clipData);
      setSelection(null);
    });
  
  }, [selection, selectedClip, onAddToTimeline, timelineRows, setTimelineRows]);

  const renderTranscript = () => {
    if (!transcriptData?.transcription) {
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
  
    return transcriptData.transcription.map((item, index) => (
      <Box key={`segment-${index}`} sx={{ mb: 2 }}>
        <Typography 
          variant="subtitle2" 
          color="primary"
          sx={{ mb: 0.5, fontWeight: 500 }}
        >
          Speaker {item.segment.speaker}
        </Typography>
        <Box sx={{ fontSize: '0.875rem', lineHeight: 1.75 }}>
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
                  : selection?.start === word.start || selection?.end === word.end
                  ? 'primary.dark'
                  : selection?.start <= word.start && selection?.end >= word.end
                  ? 'primary.light'
                  : 'transparent',
                color: (currentTime >= word.start && currentTime < word.end) ||
                      (selection?.start <= word.start && selection?.end >= word.end)
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
        </Box>
      </Box>
    ));
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
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 500 }}>Selected: </Box>
              {selection.start.toFixed(2)}s - {selection.end.toFixed(2)}s
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddToTimeline}
              startIcon={<AddIcon />}
            >
              Add to Timeline
            </Button>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptViewer;