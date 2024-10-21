import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Button, LinearProgress } from '@mui/material';

const TimelineViewer = ({ clips }) => {
  const [playing, setPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState(null);

  useEffect(() => {
    if (clips.length > 0) {
      setCurrentClipIndex(0);
      setProgress(0);
      setPlaying(false);
      updateCurrentUrl(0);
    }
  }, [clips]);

  const updateCurrentUrl = (index) => {
    if (clips[index]) {
      const url = URL.createObjectURL(clips[index].file);
      setCurrentUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  };

  const handleProgress = ({ played }) => {
    const currentClip = clips[currentClipIndex];
    if (currentClip) {
      const clipDuration = currentClip.endTime - currentClip.startTime;
      const currentTime = currentClip.startTime + played * clipDuration;
      setProgress(currentTime);

      if (currentTime >= currentClip.endTime) {
        handleNextClip();
      }
    }
  };

  const handleNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex(prevIndex => {
        updateCurrentUrl(prevIndex + 1);
        return prevIndex + 1;
      });
    } else {
      setPlaying(false);
      setCurrentClipIndex(0);
      updateCurrentUrl(0);
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (clips.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No clips in timeline</Typography>
      </Box>
    );
  }

  const currentClip = clips[currentClipIndex];
  const totalDuration = clips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, mb: 2, bgcolor: 'black', position: 'relative' }}>
        {currentUrl && (
          <ReactPlayer
            ref={playerRef}
            url={currentUrl}
            width="100%"
            height="100%"
            playing={playing}
            onProgress={handleProgress}
            progressInterval={100}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous"
                }
              }
            }}
            onEnded={handleNextClip}
          />
        )}
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={(progress / totalDuration) * 100} 
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography>
          Clip: {currentClipIndex + 1} / {clips.length}
        </Typography>
        <Typography>
          Time: {formatTime(progress)} / {formatTime(totalDuration)}
        </Typography>
        <Button onClick={handlePlayPause} variant="contained">
          {playing ? 'Pause' : 'Play'}
        </Button>
      </Box>
    </Box>
  );
};

export default TimelineViewer;