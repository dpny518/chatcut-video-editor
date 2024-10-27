import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Player } from 'video-react';
import 'video-react/dist/video-react.css';
import { Box, Button, Typography, Alert } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';
import useTimelineStore from '../../stores/timelineStore';
import useMediaStore from '../../stores/mediaStore';
import { shallow } from 'zustand/shallow';

const TimelineViewer = () => {
  // Split store selectors to prevent unnecessary re-renders
  const {
    clips,
    playbackTime,
    isPlaying,
    setPlaybackTime,
    setIsPlaying
  } = useTimelineStore(
    state => ({
      clips: state.clips,
      playbackTime: state.playbackTime,
      isPlaying: state.isPlaying,
      setPlaybackTime: state.setPlaybackTime,
      setIsPlaying: state.setIsPlaying
    }),
    shallow
  );

  const setNotification = useMediaStore(state => state.setNotification);

  // Refs
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const currentClipRef = useRef(null);

  // Memoized calculations
  const duration = useMemo(() => 
    clips.reduce((max, clip) => {
      const end = clip.metadata?.timeline?.end || (clip.startTime + clip.duration);
      return Math.max(max, end);
    }, 0),
    [clips]
  );

  // Memoized active clip getter
  const getActiveClip = useCallback((time) => {
    for (const clip of clips) {
      const timelineStart = clip.metadata?.timeline?.start || 0;
      const timelineEnd = clip.metadata?.timeline?.end || (timelineStart + clip.duration);
      
      if (time >= timelineStart && time <= timelineEnd) {
        const clipProgress = (time - timelineStart) / (timelineEnd - timelineStart);
        const sourceTime = clip.startTime + (clipProgress * (clip.endTime - clip.startTime));
        
        return {
          clip,
          sourceTime,
          timelineStart,
          timelineEnd
        };
      }
    }
    return null;
  }, [clips]);

  // Playback animation effect
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setPlaybackTime(prevTime => {
        const newTime = prevTime + delta;
        if (newTime >= duration) {
          setIsPlaying(false);
          setNotification('Playback complete', 'info');
          return 0;
        }
        return newTime;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, duration, setPlaybackTime, setIsPlaying, setNotification]);

  // Video playback and seeking effect
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const activeClip = getActiveClip(playbackTime);
    
    if (activeClip) {
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
        player.seek(activeClip.sourceTime);
        currentClipRef.current = activeClip;
        setNotification(`Playing clip: ${activeClip.clip.name}`, 'info');
      }

      if (isPlaying && player.getState().player.paused) {
        player.play();
      }
    } else {
      player.pause();
      currentClipRef.current = null;
    }
  }, [playbackTime, getActiveClip, isPlaying, setNotification]);

  // Clip transition effect
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleStateChange = (state) => {
      if (!currentClipRef.current) return;

      const activeClip = currentClipRef.current;
      if (state.currentTime >= activeClip.clip.endTime) {
        player.pause();
        
        const nextClipInfo = getActiveClip(activeClip.timelineEnd + 0.1);
        if (nextClipInfo) {
          player.seek(nextClipInfo.sourceTime);
          currentClipRef.current = nextClipInfo;
          if (isPlaying) {
            player.play();
          }
          setNotification(`Playing next clip: ${nextClipInfo.clip.name}`, 'info');
        }
      }
    };

    const unsubscribe = player.subscribeToStateChange(handleStateChange);
    return () => unsubscribe?.();
  }, [isPlaying, getActiveClip, setNotification]);

  // Memoized handlers
  const handlePlay = useCallback(() => {
    const activeClip = getActiveClip(playbackTime);
    if (activeClip) {
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
        playerRef.current?.seek(activeClip.sourceTime);
        currentClipRef.current = activeClip;
      }
      setIsPlaying(true);
      setNotification('Playing timeline', 'info');
    }
  }, [playbackTime, getActiveClip, setIsPlaying, setNotification]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    playerRef.current?.pause();
    setNotification('Playback paused', 'info');
  }, [setIsPlaying, setNotification]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    const firstClip = getActiveClip(0);
    if (firstClip) {
      currentClipRef.current = firstClip;
      playerRef.current?.seek(firstClip.sourceTime);
      setNotification('Timeline reset to start', 'info');
    }
  }, [setIsPlaying, setPlaybackTime, getActiveClip, setNotification]);

  // Memoized formatTime function
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  // Memoized debug info
  const debugInfo = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    const activeClip = getActiveClip(playbackTime);
    return {
      playbackTime,
      activeClip: activeClip ? {
        id: activeClip.clip.id,
        timelineStart: activeClip.timelineStart,
        timelineEnd: activeClip.timelineEnd,
        sourceTime: activeClip.sourceTime
      } : null
    };
  }, [playbackTime, getActiveClip]);

  if (!clips.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          Add clips to the timeline to start playback
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{
        position: 'relative',
        '& .video-react-control-bar': {
          display: 'none !important'
        }
      }}>
        <Player
          ref={playerRef}
          autoPlay={false}
          fluid={true}
          playsInline
          startTime={clips[0].startTime}
        >
          <source src={URL.createObjectURL(clips[0].file)} />
        </Player>
      </Box>

      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1
      }}>
        <Button 
          variant="contained"
          onClick={isPlaying ? handlePause : handlePlay}
          startIcon={isPlaying ? <PauseCircle /> : <PlayCircle />}
          size="small"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button 
          variant="outlined"
          onClick={handleReset}
          startIcon={<SkipBack />}
          size="small"
        >
          Reset
        </Button>

        <Typography variant="body2" sx={{ ml: 2 }}>
          {formatTime(playbackTime)} / {formatTime(duration)}
        </Typography>
      </Box>

      {debugInfo && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ m: 0 }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(TimelineViewer);