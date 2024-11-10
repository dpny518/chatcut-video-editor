import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  Box,
  Card, 
  CardContent, 
  Button, 
  Typography,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';

// Remove duplicate useEffect (you have two versions - one using selectedClip and one using selectedClips)

const TranscriptViewer = ({ 
  clips,
  selectedClips, // Changed from selectedClip
  transcriptData,
  mergedContent, // Add this prop
  onAddToTimeline,
  timelineRows,
  setTimelineRows,
  masterClipManager,
  sx
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [selection, setSelection] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  
  // Update useEffect to use selectedClip.file
  useEffect(() => {
    if (videoRef.current && selectedClips?.[0]?.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(selectedClips[0].file);
      videoRef.current.src = videoUrlRef.current;
    }
  
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, [selectedClips]);
  const handleWordSelection = useCallback((startWord, endWord, text) => {
    setSelection({
      start: startWord.start,
      end: endWord.end,
      text,
      startWord,
      endWord
    });
  }, []);

  useEffect(() => {
    if (videoRef.current && selectedClips?.[0]?.file) {
      try {
        if (videoUrlRef.current) {
          URL.revokeObjectURL(videoUrlRef.current);
        }
        videoUrlRef.current = URL.createObjectURL(selectedClips[0].file);
        videoRef.current.src = videoUrlRef.current;
        
        videoRef.current.onerror = (e) => {
          console.error('Error loading video:', e);
        };
        
      } catch (error) {
        console.error('Error setting up video:', error);
      }
    }
  
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, [selectedClips]);
  const transcriptContent = useMemo(() => {
    if (mergedContent && selectedClips?.length > 1) {  // Check length
      return {
        transcription: mergedContent.mergedTranscript,
        isMerged: true
      };
    }
    return {
      transcription: transcriptData?.transcription,
      isMerged: false
    };
  }, [mergedContent, transcriptData, selectedClips]);

  useEffect(() => {
    // Add null check for selectedClips
    if (!selectedClips?.length) return;  // Early return if no clips
    
    if (videoRef.current && selectedClips[0]?.file) {
      try {
        if (videoUrlRef.current) {
          URL.revokeObjectURL(videoUrlRef.current);
        }
        videoUrlRef.current = URL.createObjectURL(selectedClips[0].file);
        videoRef.current.src = videoUrlRef.current;
        
        videoRef.current.onerror = (e) => {
          console.error('Error loading video:', e);
        };
      } catch (error) {
        console.error('Error setting up video:', error);
      }
    }
  
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
    };
  }, [selectedClips]);


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
      const sourceFile = startNode.getAttribute('data-source');
  
      const words = mergedContent 
        ? mergedContent.mergedTranscript.flatMap(item => item.words)
        : transcriptData?.transcription.flatMap(item => item.words);
  
      const allWords = words?.filter(word => 
        word.start >= startTime && 
        word.end <= endTime &&
        (!mergedContent || word.sourceFile === sourceFile)
      );
  
      if (allWords?.length > 0) {
        const startWord = allWords[0];
        const endWord = allWords[allWords.length - 1];
        handleWordSelection(startWord, endWord, selection.toString());
      }
    }
  }, [mergedContent, transcriptData, handleWordSelection]);

 const handleAddToTimeline = useCallback(() => {
  if (!selection || !selectedClips?.length) return;  // Add check for selectedClips

  const activeClip = mergedContent && selectedClips.length > 1 ? {
    file: selectedClips[0].file,
    name: `Merged (${selectedClips.length} clips)`,
    isMerged: true
  } : selectedClips[0];
  
    if (activeClip.isMerged) {
      // Create merged clip
      const clipData = masterClipManager.createTimelineClip({
        startTime: selection.start,
        endTime: selection.end,
        ranges: mergedContent.ranges,
        type: 'merged',
        transcript: selection.text
      });
      onAddToTimeline?.(clipData);
      setSelection(null);
    } else {
      // Create single clip
      const video = document.createElement('video');
      video.src = URL.createObjectURL(activeClip.file);
      
      video.addEventListener('loadedmetadata', () => {
        const clipStart = selection.start;
        const clipEnd = selection.end;
        const timelineDuration = clipEnd - clipStart;
  
        const findTimelineEndPosition = (clips) => {
          if (!clips.length) return 0;
          return Math.max(...clips.map(clip => clip.metadata?.timeline?.end || 0));
        };
  
        const timelineStart = findTimelineEndPosition(clips);
        const timelineEnd = timelineStart + timelineDuration;
        
        const clipData = {
          id: `clip-${Date.now()}`,
          file: activeClip.file,
          name: activeClip.file.name,
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
              row: 0
            },
            playback: {
              start: clipStart,
              end: clipEnd,
              duration: timelineDuration
            }
          }
        };
  
        // Cleanup
        video.src = '';
        URL.revokeObjectURL(video.src);
        onAddToTimeline?.(clipData);
        setSelection(null);
      });
    }
  }, [selection, selectedClips, mergedContent, masterClipManager, onAddToTimeline, clips]);

  const renderTranscript = () => {
    if (!transcriptContent.transcription) {
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
    
    return transcriptContent.transcription.map((item, index) => (
      <Box 
        key={`segment-${index}`} 
        sx={{ 
          mb: 2,
          ...(transcriptContent.isMerged && {
            borderLeft: 2,
            borderColor: 'primary.main',
            pl: 2
          })
        }}
      >
        <Typography 
          variant="subtitle2" 
          color="primary"
          sx={{ mb: 0.5, fontWeight: 500 }}
        >
          {transcriptContent.isMerged ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Source: {item.sourceFile}</span>
              <Typography variant="caption" color="text.secondary">
                {item.startTime?.toFixed(2)}s - {item.endTime?.toFixed(2)}s
              </Typography>
            </Box>
          ) : (
            `Speaker ${item.segment.speaker}`
          )}
        </Typography>
      <Box sx={{ fontSize: '0.875rem', lineHeight: 1.75 }}>
        {item.words.map((word, wordIndex) => (
          <Box
            component="span"
            key={`word-${wordIndex}`}
            data-time={word.start}
            data-time-end={word.end}
            data-source={word.sourceFile}
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

TranscriptViewer.propTypes = {
  clips: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    file: PropTypes.object,
    name: PropTypes.string,
    metadata: PropTypes.object
  })),
  selectedClips: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    file: PropTypes.object,
    name: PropTypes.string
  })),
  transcriptData: PropTypes.shape({
    transcription: PropTypes.arrayOf(PropTypes.object)
  }),
  mergedContent: PropTypes.shape({
    mergedTranscript: PropTypes.array,
    ranges: PropTypes.array,
    totalDuration: PropTypes.number
  }),
  onAddToTimeline: PropTypes.func.isRequired,
  timelineRows: PropTypes.arrayOf(PropTypes.shape({
    rowId: PropTypes.number,
    clips: PropTypes.array,
    lastEnd: PropTypes.number
  })),
  setTimelineRows: PropTypes.func,
  masterClipManager: PropTypes.object.isRequired,
  sx: PropTypes.object
};

// Add default props
TranscriptViewer.defaultProps = {
  clips: [],
  selectedClips: [],
  transcriptData: null,
  mergedContent: null,
  timelineRows: [],
  setTimelineRows: () => {},
  sx: {}
};

export default TranscriptViewer;