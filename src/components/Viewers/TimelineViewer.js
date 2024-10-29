import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from 'video-react';
import 'video-react/dist/video-react.css';
import { Box, Button } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';

const TimelineViewer = ({ clips = [] }) => {
  const [timelineTime, setTimelineTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const currentClipRef = useRef(null);

  // Calculate total timeline duration
  const duration = clips.reduce((max, clip) => {
    const end = clip.metadata?.timeline?.end || (clip.startTime + clip.duration);
    return Math.max(max, end);
  }, 0);

  // Get active clip and source time for current timeline position
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

  // Handle timeline playback
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setTimelineTime(prevTime => {
        const newTime = prevTime + delta;
        if (newTime >= duration) {
          setIsPlaying(false);
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
  }, [isPlaying, duration]);

  // Handle video playback and seeking
  useEffect(() => {
    if (!playerRef.current) return;

    const activeClip = getActiveClip(timelineTime);
    const player = playerRef.current;
    
    if (activeClip) {
      // Only seek if changing clips
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
        console.log('Changing clip, seeking to:', activeClip.sourceTime);
        player.seek(activeClip.sourceTime);
        currentClipRef.current = activeClip;
      }

      if (isPlaying && player.getState().player.paused) {
        player.play();
      }
    } else {
      player.pause();
      currentClipRef.current = null;
    }
  }, [timelineTime, getActiveClip, isPlaying]);

  // Monitor playback and handle clip transitions
  useEffect(() => {
    if (!playerRef.current) return;

    const handleStateChange = (state) => {
      if (!currentClipRef.current) return;

      const activeClip = currentClipRef.current;
      if (state.currentTime >= activeClip.clip.endTime) {
        playerRef.current.pause();
        
        // Find next clip if available
        const nextClipInfo = getActiveClip(activeClip.timelineEnd + 0.1);
        if (nextClipInfo) {
          playerRef.current.seek(nextClipInfo.sourceTime);
          currentClipRef.current = nextClipInfo;
          if (isPlaying) {
            playerRef.current.play();
          }
        }
      }
    };

    playerRef.current.subscribeToStateChange(handleStateChange);
  }, [isPlaying, getActiveClip]);

  const handlePlay = () => {
    const activeClip = getActiveClip(timelineTime);
    if (activeClip) {
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
        playerRef.current.seek(activeClip.sourceTime);
        currentClipRef.current = activeClip;
      }
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    playerRef.current?.pause();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimelineTime(0);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    const firstClip = getActiveClip(0);
    if (firstClip) {
      currentClipRef.current = firstClip;
      playerRef.current?.seek(firstClip.sourceTime);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (!clips.length) {
    return <div>No clips loaded</div>;
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Add a wrapper div with CSS to hide video-react controls */}
      <div className="video-player-wrapper">
        <style>
          {`
            .video-player-wrapper .video-react-control-bar {
              display: none !important;
            }
            .video-player-wrapper .video-react-big-play-button {
              display: none !important;
            }
          `}
        </style>
        <Player
          ref={playerRef}
          autoPlay={false}
          fluid={true}
          playsInline
          startTime={clips[0].startTime}
        >
          <source src={URL.createObjectURL(clips[0].file)} />
        </Player>
      </div>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          onClick={isPlaying ? handlePause : handlePlay}
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

        <Box sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
          Timeline: {formatTime(timelineTime)} / {formatTime(duration)}
        </Box>
      </Box>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
        <pre>
          {JSON.stringify({
            timelineTime,
            activeClip: getActiveClip(timelineTime) ? {
              id: getActiveClip(timelineTime).clip.id,
              timelineStart: getActiveClip(timelineTime).timelineStart,
              timelineEnd: getActiveClip(timelineTime).timelineEnd,
              sourceTime: getActiveClip(timelineTime).sourceTime
            } : null
          }, null, 2)}
        </pre>
      </Box>
    </Box>
  );
};

export default TimelineViewer;