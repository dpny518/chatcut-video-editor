import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, LinearProgress } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';

const TimelineViewer = ({ clips = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRefs = useRef(new Map());
  const urlRefs = useRef(new Map());
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);

  // Create and manage video URLs
  useEffect(() => {
    if (!clips?.length) return;

    // Clean up old URLs
    urlRefs.current.forEach(url => URL.revokeObjectURL(url));
    urlRefs.current.clear();

    // Create new URLs for valid files
    clips.forEach(clip => {
      if (clip.file instanceof File) {
        try {
          const url = URL.createObjectURL(clip.file);
          urlRefs.current.set(clip.id, url);
        } catch (error) {
          console.error('Failed to create URL for clip:', clip.id, error);
        }
      }
    });

    // Calculate duration
    const maxEndTime = Math.max(...clips.map(clip => {
      const clipDuration = clip.endTime - clip.startTime;
      const timelineStart = clip.metadata?.timeline?.start || 0;
      return timelineStart + clipDuration;
    }));
    
    setDuration(maxEndTime);
    videoRefs.current = new Map();

    // Cleanup function
    return () => {
      urlRefs.current.forEach(url => URL.revokeObjectURL(url));
      urlRefs.current.clear();
    };
  }, [clips]);

  // Rest of the existing playback logic remains the same
  const startPlayback = () => {
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
        const clipDuration = clip.endTime - clip.startTime;
        const clipEnd = clipStart + clipDuration;

        if (newTime >= clipStart && newTime <= clipEnd) {
          const sourceOffset = clip.startTime + (newTime - clipStart);
          
          if (video.paused) {
            video.currentTime = sourceOffset;
            video.play().catch(console.error);
          }
          
          if (Math.abs(video.currentTime - sourceOffset) > 0.1) {
            video.currentTime = sourceOffset;
          }
        } else if (!video.paused) {
          video.pause();
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

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const handleReset = () => {
    pausePlayback();
    setCurrentTime(0);
  };

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
      urlRefs.current.clear();
    };
  }, []);

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
        {clips.map(clip => {
          const url = urlRefs.current.get(clip.id);
          if (!url) return null;

          const clipStart = clip.metadata?.timeline?.start || 0;
          const clipDuration = clip.endTime - clip.startTime;
          const clipEnd = clipStart + clipDuration;

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
                opacity: currentTime >= clipStart && currentTime <= clipEnd ? 1 : 0
              }}
            />
          );
        })}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          onClick={togglePlay}
          startIcon={isPlaying ? <PauseCircle /> : <PlayCircle />}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button 
          onClick={handleReset}
          startIcon={<SkipBack />}
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
                transition: 'none'
              }
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