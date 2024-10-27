import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Alert, CircularProgress, Button } from '@mui/material';
import { debounce } from 'lodash';
import useMediaStore from   '../../stores/mediaStore';

const MIN_CLIP_DURATION = 1;
const SEEK_DEBOUNCE_MS = 100;
const PROGRESS_INTERVAL = 100;

const BinViewer = () => {
  // Get state and actions from store
  const {
    selectedFile,
    addToTimeline,
    setNotification,
    getTranscriptForFile
  } = useMediaStore(state => ({
    selectedFile: state.selectedFile,
    addToTimeline: state.addToTimeline,
    setNotification: state.setNotification,
    getTranscriptForFile: state.getTranscriptForFile
  }));

  // Local state
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  // Refs
  const playerRef = useRef(null);
  const urlRef = useRef(null);

  const cleanupVideoUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (selectedFile?.file) {
      try {
        cleanupVideoUrl();
        urlRef.current = URL.createObjectURL(selectedFile.file);
        setVideoUrl(urlRef.current);
        setPlaying(false);
        setCurrentTime(0);
        setRange([0, 0]);
      } catch (err) {
        setError(`Failed to load video: ${err.message}`);
        setNotification(`Failed to load video: ${err.message}`, 'error');
      }
    } else {
      setVideoUrl(null);
    }

    setLoading(false);
    return cleanupVideoUrl;
  }, [selectedFile, cleanupVideoUrl, setNotification]);

  const debouncedSeek = useCallback(
    debounce((time) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
      }
    }, SEEK_DEBOUNCE_MS),
    []
  );

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
      
      if (state.playedSeconds >= range[1]) {
        setPlaying(false);
        debouncedSeek(range[0]);
      }
    },
    [range, debouncedSeek]
  );

  const handleRangeChange = (event, newValue) => {
    const [start, end] = newValue;
    
    if (end - start < MIN_CLIP_DURATION) {
      return;
    }
    
    setRange(newValue);
    debouncedSeek(newValue[0]);
  };

  const handleError = (error) => {
    console.error('Video playback error:', error);
    const errorMessage = 'Failed to play video. Please try again or select a different file.';
    setError(errorMessage);
    setNotification(errorMessage, 'error');
    setPlaying(false);
  };

  const handleAddToTimeline = useCallback(() => {
    if (!selectedFile || error) return;

    const clipData = {
      id: `clip-${Date.now()}`,
      file: selectedFile.file,
      name: selectedFile.file.name,
      startTime: range[0],
      endTime: range[1],
      duration: range[1] - range[0],
      source: {
        startTime: 0,
        endTime: duration,
        duration: duration
      },
      // Get matching transcript if exists
      transcript: getTranscriptForFile(selectedFile.name)
    };

    addToTimeline(clipData);
    setNotification(`Added clip from ${formatTime(range[0])} to ${formatTime(range[1])}`, 'success');
  }, [selectedFile, error, range, duration, addToTimeline, getTranscriptForFile, setNotification]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

  if (error) {
    return (
      <Box sx={{ height: '100%', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setError(null)}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (!selectedFile) {
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
        <Box sx={{
          position: 'relative',
          mt: -4,
          mb: 1,
          height: 0
        }}>
          <Box sx={{
            position: 'absolute',
            left: `${(currentTime / duration) * 100}%`,
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