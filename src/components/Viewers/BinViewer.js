import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Alert, CircularProgress } from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { Button } from '@mui/material';
import { debounce } from 'lodash';

// Constants
const MIN_CLIP_DURATION = 1; // minimum clip duration in seconds
const SEEK_DEBOUNCE_MS = 100; // debounce delay for seeking
const PROGRESS_INTERVAL = 100; // progress update interval in ms

const BinViewer = ({ selectedClip, onAddToTimeline }) => {
  // State management
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [timelineRows, setTimelineRows] = useState([{ rowId: 0, clips: [], lastEnd: 0 }]);


  // Refs
  const playerRef = useRef(null);
  const urlRef = useRef(null);

  // Cleanup function for URL objects
  const cleanupVideoUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Handle video file changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (selectedClip?.file) {
      try {
        cleanupVideoUrl();
        urlRef.current = URL.createObjectURL(selectedClip.file);
        setVideoUrl(urlRef.current);
        setPlaying(false);
        setCurrentTime(0);
        setRange([0, 0]);
      } catch (err) {
        setError(`Failed to load video: ${err.message}`);
      }
    } else {
      setVideoUrl(null);
    }

    setLoading(false);

    // Cleanup on unmount or clip change
    return cleanupVideoUrl;
  }, [selectedClip, cleanupVideoUrl]);

  // Debounced seek function to improve performance
  // eslint-disable-next-line
  const debouncedSeek = useCallback(
    debounce((time) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
      }
    }, SEEK_DEBOUNCE_MS),
    []
  );

  // Handlers
  const handlePlayPause = () => {
    if (error) return;
    setPlaying(!playing);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    setRange([0, duration]);
  };

  const handleProgress = useCallback(
    state => {
      setCurrentTime(state.playedSeconds);
      
      // Stop playback if we reach the end of the selected range
      if (state.playedSeconds >= range[1]) {
        setPlaying(false);
        debouncedSeek(range[0]);
      }
    },
    [range, debouncedSeek]
  );

  const handleRangeChange = (event, newValue) => {
    const [start, end] = newValue;
    
    // Validate range selection
    if (end - start < MIN_CLIP_DURATION) {
      return;
    }
    
    setRange(newValue);
    debouncedSeek(newValue[0]);
  };

  const handleError = (error) => {
    console.error('Video playback error:', error);
    setError('Failed to play video. Please try again or select a different file.');
    setPlaying(false);
  };



  const handleAddToTimeline = () => {
    if (!selectedClip || error) return;
  
    const clipStart = range[0];
    const clipEnd = range[1];
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
    const timelineStart = timelineRows[0].lastEnd || 0;
    const timelineEnd = timelineStart + timelineDuration;
    
    // Find suitable row for the clip
    const rowIndex = findSuitableRow(timelineStart, timelineEnd);
  
    // Create clip data with timeline metadata
    const clipData = {
      id: `clip-${Date.now()}`,
      file: selectedClip.file,
      name: selectedClip.file.name,
      startTime: clipStart,
      endTime: clipEnd,
      duration: timelineDuration,
      source: {
        startTime: 0,
        endTime: duration,
        duration: duration
      },
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
  
    // Call the callback function to add clip to the main timeline
    onAddToTimeline?.(clipData);
    
    console.log('Adding clip with metadata:', {
      clip: clipData,
      timeline: clipData.metadata.timeline,
      playback: clipData.metadata.playback,
      rowIndex
    });
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ height: '100%', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" color="primary" onClick={() => setError(null)}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Empty state
  if (!selectedClip) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography>No video selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      p: 2,
      borderRadius: 1,
    }}>
      <Typography variant="h6" gutterBottom sx={{ 
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        {selectedClip.file.name}
      </Typography>

      <Box sx={{ 
        position: 'relative', 
        flexGrow: 1, 
        mb: 2,
        bgcolor: 'black',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        {videoUrl && (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={playing}
            onDuration={handleDuration}
            onProgress={handleProgress}
            onError={handleError}
            progressInterval={PROGRESS_INTERVAL}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous"
                }
              }
            }}
          />
        )}
      </Box>

      <Box sx={{ mb: 2, px: 1 }}>
        <Slider
          value={range}
          onChange={handleRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          min={0}
          max={duration}
          step={0.1}
          disabled={!duration}
          sx={{
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            }
          }}
        />
        <Box
          sx={{
            position: 'relative',
            mt: -4,
            mb: 1,
            height: 0
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${(currentTime / duration) * 100}%`,
              transform: 'translateX(-50%)',
              width: '2px',
              height: '16px',
              bgcolor: 'error.main',
              transition: 'left 0.1s linear'
            }}
          />
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        px: 1
      }}>
        <Typography variant="body2" color="text.secondary">
          Selected: {formatTime(range[0])} - {formatTime(range[1])}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({formatTime(range[1] - range[0])})
          </Typography>
        </Typography>
        <Button 
          onClick={handlePlayPause}
          variant="contained"
          size="small"
          disabled={!duration}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
      </Box>

      <Button 
        onClick={handleAddToTimeline}
        variant="contained"
        color="primary"
        disabled={!duration || range[1] - range[0] < MIN_CLIP_DURATION}
        fullWidth
      >
        Add to Timeline
      </Button>
    </Box>
  );
};

export default BinViewer;