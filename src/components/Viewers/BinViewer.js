import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Alert, CircularProgress, Button } from '@mui/material';
import { debounce } from 'lodash';
import useMediaStore from '../../stores/mediaStore';

const MIN_CLIP_DURATION = 1;
const SEEK_DEBOUNCE_MS = 100;
const PROGRESS_INTERVAL = 100;

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const BinViewer = () => {
  // Memoized selectors for store
  const selectedFile = useMediaStore(state => state.selectedFile);
  const addToTimeline = useMediaStore(state => state.addToTimeline);
  const setNotification = useMediaStore(state => state.setNotification);
  const getTranscriptForFile = useMediaStore(state => state.getTranscriptForFile);

  // Player state
  const [playerState, setPlayerState] = useState({
    playing: false,
    duration: 0,
    currentTime: 0,
    range: [0, 0]
  });

  // UI state
  const [uiState, setUiState] = useState({
    loading: false,
    error: null,
    videoUrl: null
  });

  // Refs
  const playerRef = useRef(null);
  const urlRef = useRef(null);
  const debouncedSeekRef = useRef(null);

  // Memoize debounced seek function
  debouncedSeekRef.current = useMemo(
    () => debounce((time) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
      }
    }, SEEK_DEBOUNCE_MS),
    []
  );

  // Cleanup function
  const cleanupVideoUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Handle file changes
  useEffect(() => {
    setUiState(prev => ({ ...prev, loading: true, error: null }));

    if (selectedFile?.file) {
      try {
        cleanupVideoUrl();
        urlRef.current = URL.createObjectURL(selectedFile.file);
        
        setUiState(prev => ({ 
          ...prev, 
          videoUrl: urlRef.current 
        }));
        
        setPlayerState(prev => ({
          ...prev,
          playing: false,
          currentTime: 0,
          range: [0, 0]
        }));
      } catch (err) {
        const errorMsg = `Failed to load video: ${err.message}`;
        setUiState(prev => ({ ...prev, error: errorMsg }));
        setNotification(errorMsg, 'error');
      }
    } else {
      setUiState(prev => ({ ...prev, videoUrl: null }));
    }

    setUiState(prev => ({ ...prev, loading: false }));
    return cleanupVideoUrl;
  }, [selectedFile, cleanupVideoUrl, setNotification]);

  // Handlers
  const handlePlayPause = useCallback(() => {
    if (uiState.error) return;
    setPlayerState(prev => ({ ...prev, playing: !prev.playing }));
  }, [uiState.error]);

  const handleDuration = useCallback((duration) => {
    setPlayerState(prev => ({
      ...prev,
      duration,
      range: [0, duration]
    }));
  }, []);

  const handleProgress = useCallback(
    state => {
      setPlayerState(prev => {
        const newTime = state.playedSeconds;
        
        if (newTime >= prev.range[1]) {
          debouncedSeekRef.current?.(prev.range[0]);
          return {
            ...prev,
            playing: false,
            currentTime: prev.range[0]
          };
        }
        
        return {
          ...prev,
          currentTime: newTime
        };
      });
    },
    []
  );

  const handleRangeChange = useCallback((event, newValue) => {
    const [start, end] = newValue;
    
    if (end - start < MIN_CLIP_DURATION) {
      return;
    }
    
    setPlayerState(prev => ({ ...prev, range: newValue }));
    debouncedSeekRef.current?.(newValue[0]);
  }, []);

  const handleError = useCallback((error) => {
    console.error('Video playback error:', error);
    const errorMessage = 'Failed to play video. Please try again or select a different file.';
    setUiState(prev => ({ ...prev, error: errorMessage }));
    setNotification(errorMessage, 'error');
    setPlayerState(prev => ({ ...prev, playing: false }));
  }, [setNotification]);

  const handleAddToTimeline = useCallback(() => {
    if (!selectedFile || uiState.error) return;

    const clipData = {
      id: `clip-${Date.now()}`,
      file: selectedFile.file,
      name: selectedFile.file.name,
      startTime: playerState.range[0],
      endTime: playerState.range[1],
      duration: playerState.range[1] - playerState.range[0],
      source: {
        startTime: 0,
        endTime: playerState.duration,
        duration: playerState.duration
      },
      transcript: getTranscriptForFile(selectedFile.name)
    };

    addToTimeline(clipData);
    setNotification(
      `Added clip from ${formatTime(playerState.range[0])} to ${formatTime(playerState.range[1])}`,
      'success'
    );
  }, [
    selectedFile,
    uiState.error,
    playerState.range,
    playerState.duration,
    addToTimeline,
    getTranscriptForFile,
    setNotification
  ]);

  // Memoized UI elements
  const loadingView = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  ), []);

  const errorView = useMemo(() => (
    <Box sx={{ height: '100%', p: 2 }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        {uiState.error}
      </Alert>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setUiState(prev => ({ ...prev, error: null }))}
      >
        Try Again
      </Button>
    </Box>
  ), [uiState.error]);

  const emptyView = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography>No video selected</Typography>
    </Box>
  ), []);

  if (uiState.loading) return loadingView;
  if (uiState.error) return errorView;
  if (!selectedFile) return emptyView;

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
        {selectedFile.file.name}
      </Typography>

      <Box sx={{ 
        position: 'relative', 
        flexGrow: 1, 
        mb: 2,
        bgcolor: 'black',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        {uiState.videoUrl && (
          <ReactPlayer
            ref={playerRef}
            url={uiState.videoUrl}
            width="100%"
            height="100%"
            playing={playerState.playing}
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
          value={playerState.range}
          onChange={handleRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          min={0}
          max={playerState.duration}
          step={0.1}
          disabled={!playerState.duration}
          sx={{
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            }
          }}
        />
        <Box sx={{
          position: 'relative',
          mt: -4,
          mb: 1,
          height: 0
        }}>
          <Box sx={{
            position: 'absolute',
            left: `${(playerState.currentTime / playerState.duration) * 100}%`,
            transform: 'translateX(-50%)',
            width: '2px',
            height: '16px',
            bgcolor: 'error.main',
            transition: 'left 0.1s linear'
          }} />
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
          Selected: {formatTime(playerState.range[0])} - {formatTime(playerState.range[1])}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({formatTime(playerState.range[1] - playerState.range[0])})
          </Typography>
        </Typography>
        <Button 
          onClick={handlePlayPause}
          variant="contained"
          size="small"
          disabled={!playerState.duration}
        >
          {playerState.playing ? 'Pause' : 'Play'}
        </Button>
      </Box>

      <Button 
        onClick={handleAddToTimeline}
        variant="contained"
        color="primary"
        disabled={!playerState.duration || playerState.range[1] - playerState.range[0] < MIN_CLIP_DURATION}
        fullWidth
      >
        Add to Timeline
      </Button>
    </Box>
  );
};

export default React.memo(BinViewer);