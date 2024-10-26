import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, LinearProgress } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';

const TimelineViewer = ({ clips = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videosReady, setVideosReady] = useState(false);
  const videoRefs = useRef(new Map());
  const urlRefs = useRef(new Map());
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };
  
  // Create and manage video URLs
  useEffect(() => {
    if (!clips?.length) return;
    setVideosReady(false);

    const currentUrlRefs = urlRefs.current;
    currentUrlRefs.forEach(url => URL.revokeObjectURL(url));
    currentUrlRefs.clear();

    // Create new URLs for valid files
    clips.forEach(clip => {
      if (clip.file instanceof File) {
        try {
          const url = URL.createObjectURL(clip.file);
          currentUrlRefs.set(clip.id, url);
        } catch (error) {
          console.error('Failed to create URL for clip:', clip.id, error);
        }
      }
    });

    // Calculate duration
    const maxEndTime = Math.max(...clips.map(clip => {
      const timelineEnd = clip.metadata?.timeline?.end || 0;
      return timelineEnd;
    }));
    
    setDuration(maxEndTime);
    videoRefs.current = new Map();

    return () => {
      const urlsToCleanup = new Map(currentUrlRefs);
      urlsToCleanup.forEach(url => URL.revokeObjectURL(url));
    };
  }, [clips]);

  // Initialize videos to their starting frames
  useEffect(() => {
    const initializeVideos = async () => {
      const loadPromises = clips.map(clip => {
        return new Promise((resolve) => {
          const video = videoRefs.current.get(clip.id);
          if (!video) {
            resolve();
            return;
          }

          const handleCanPlay = () => {
            // Set initial frame to clip start time
            video.currentTime = clip.startTime;
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };

          video.addEventListener('canplay', handleCanPlay);
          // In case the video is already loaded
          if (video.readyState >= 3) {
            handleCanPlay();
          }
        });
      });

      await Promise.all(loadPromises);
      setVideosReady(true);
    };

    if (clips.length > 0) {
      initializeVideos();
    }
  }, [clips]);

  // Component cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      videoRefs.current.forEach(video => {
        video.pause();
        video.src = '';
      });
      urlRefs.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const startPlayback = () => {
    if (!videosReady) return;
    
    setIsPlaying(true);
    startTimeRef.current = performance.now() - (currentTime * 1000);

    const animate = () => {
      const now = performance.now();
      const newTime = (now - startTimeRef.current) / 1000;
      
      setCurrentTime(newTime);

      clips.forEach(clip => {
        const video = videoRefs.current.get(clip.id);
        if (!video) return;

        const clipStart = clip.metadata?.timeline?.start || 0;
        const clipEnd = clip.metadata?.timeline?.end || clipStart + (clip.endTime - clip.startTime);

        if (newTime >= clipStart && newTime <= clipEnd) {
          const sourceOffset = clip.startTime + (newTime - clipStart);
          
          if (video.paused) {
            video.currentTime = sourceOffset;
            video.play().catch(console.error);
          }
          
          if (Math.abs(video.currentTime - sourceOffset) > 0.1) {
            video.currentTime = sourceOffset;
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
          // Reset to start/end frame when outside clip bounds
          if (newTime < clipStart) {
            video.currentTime = clip.startTime;
          } else if (newTime > clipEnd) {
            video.currentTime = clip.endTime;
          }
        }
      });

      if (newTime >= duration) {
        pausePlayback();
        setCurrentTime(0);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    videoRefs.current.forEach(video => video.pause());
  };

  const handleReset = () => {
    pausePlayback();
    setCurrentTime(0);
    // Reset all videos to their starting frames
    clips.forEach(clip => {
      const video = videoRefs.current.get(clip.id);
      if (video) {
        video.currentTime = clip.startTime;
      }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!clips?.length) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'black'
      }}>
        No clips to play
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: '16/9',
        bgcolor: 'black',
        overflow: 'hidden'
      }}>
        {!videosReady && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            Loading...
          </Box>
        )}
        {clips.map(clip => {
          const url = urlRefs.current.get(clip.id);
          if (!url) return null;

          const clipStart = clip.metadata?.timeline?.start || 0;
          const clipEnd = clip.metadata?.timeline?.end || clipStart + (clip.endTime - clip.startTime);

          return (
            <video
              key={clip.id}
              ref={el => el && videoRefs.current.set(clip.id, el)}
              src={url}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: currentTime >= clipStart && currentTime <= clipEnd ? 1 : 0,
                transition: 'opacity 0.1s'
              }}
            />
          );
        })}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          onClick={togglePlay}
          startIcon={isPlaying ? <PauseCircle /> : <PlayCircle />}
          disabled={!videosReady}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button 
          onClick={handleReset}
          startIcon={<SkipBack />}
          disabled={!videosReady}
        >
          Reset
        </Button>

        <Box sx={{ flex: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentTime / duration) * 100}
            sx={{ 
              height: 8, 
              cursor: 'pointer',
              '& .MuiLinearProgress-bar': {
                transition: 'none',
                backgroundColor: '#2196f3' // More subtle blue color
              },
              backgroundColor: 'rgba(255, 255, 255, 0.1)' // Darker background
            }}
          />
        </Box>

        <Box sx={{ minWidth: 60, textAlign: 'right' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineViewer;