import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Button, Slider } from '@mui/material';

const BinViewer = ({ selectedClip, onAddToTimeline }) => {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState([0, 0]);
  const playerRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);


  useEffect(() => {
    if (selectedClip && selectedClip.file) {
      setVideoUrl(URL.createObjectURL(selectedClip.file));
      setPlaying(false);
      setCurrentTime(0);
      setRange([0, 0]);
    }
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClip]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    setRange([0, duration]);
  };

  const handleProgress = useCallback(state => {
    setCurrentTime(state.playedSeconds);
    if (state.playedSeconds >= range[1]) {
      setPlaying(false);
      playerRef.current.seekTo(range[0]);
    }
  }, [range]);

  const handleRangeChange = (event, newValue) => {
    setRange(newValue);
    playerRef.current.seekTo(newValue[0]);
  };

  const handleAddToTimeline = () => {
    if (onAddToTimeline) {
      onAddToTimeline({
        file: selectedClip.file,
        startTime: range[0],
        endTime: range[1]
      });
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!selectedClip) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No video selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {selectedClip.file.name}
      </Typography>
      <Box sx={{ position: 'relative', flexGrow: 1, mb: 2 }}>
        {videoUrl && (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={playing}
            onDuration={handleDuration}
            onProgress={handleProgress}
            progressInterval={100}
          />
        )}
      </Box>
      <Box sx={{ mb: 2, position: 'relative' }}>
        <Slider
          value={range}
          onChange={handleRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          min={0}
          max={duration}
          step={0.1}
        />
        <Box
          sx={{
            position: 'absolute',
            left: `${(currentTime / duration) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'red',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography>
          Selected Range: {formatTime(range[0])} - {formatTime(range[1])}
        </Typography>
        <Button onClick={handlePlayPause} variant="contained">
          {playing ? 'Pause' : 'Play'}
        </Button>
      </Box>
      <Button onClick={handleAddToTimeline} variant="contained" color="primary">
        Add to Timeline
      </Button>
    </Box>
  );
};

export default BinViewer;