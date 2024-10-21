import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Button, LinearProgress } from '@mui/material';

const TimelineViewer = ({ clips }) => {
  const [playing, setPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState(null);

  // Log all clips data for debugging
  useEffect(() => {
    if (clips.length > 0) {
      console.log("All clips in the timeline:", clips.map((clip, index) => ({
        clipIndex: index,
        id: clip.id,
        name: clip.name,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.endTime - clip.startTime,
        fileUrl: URL.createObjectURL(clip.file),
      })));
    }
  }, [clips]);

  const updateCurrentUrl = useCallback((index) => {
    if (clips[index]) {
      const url = URL.createObjectURL(clips[index].file);
      console.log('Generated video URL: ', url); // Debugging log for current clip URL
      setCurrentUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [clips]);

  useEffect(() => {
    if (clips.length > 0) {
      setCurrentClipIndex(0);
      setProgress(clips[0].startTime); // Start at the start time of the first clip
      setPlaying(false);
      updateCurrentUrl(0);
    }
  }, [clips, updateCurrentUrl]); // Ensuring updateCurrentUrl is in the dependency array

  const handleProgress = ({ played }) => {
    const currentClip = clips[currentClipIndex];
    if (currentClip) {
      const clipDuration = currentClip.endTime - currentClip.startTime;
      const currentTime = currentClip.startTime + played * clipDuration;
      setProgress(currentTime);

      // If the current time reaches the end of the clip, move to the next one
      if (currentTime >= currentClip.endTime) {
        handleNextClip();
      }
    }
  };

  const handleNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        updateCurrentUrl(nextIndex);
        setProgress(clips[nextIndex].startTime); // Reset progress to the start time of the next clip
        return nextIndex;
      });
    } else {
      setPlaying(false);
      setCurrentClipIndex(0);
      setProgress(clips[0].startTime); // Reset progress to the start time of the first clip
      updateCurrentUrl(0);
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleClipReady = () => {
    const currentClip = clips[currentClipIndex];
    if (playerRef.current && currentClip) {
      // Delay seeking to ensure the player is fully ready
      setTimeout(() => {
        console.log('Seeking to start time (delayed): ', currentClip.startTime);
        playerRef.current.seekTo(currentClip.startTime, 'seconds');
      }, 100); // Adding a 100ms delay
    }
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
            onReady={handleClipReady}  // Ensure the player seeks to the correct start time
            progressInterval={500}     // Progress interval at 500ms
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
