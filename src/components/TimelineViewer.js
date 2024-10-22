import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { Button } from '@mui/material';
import { PlayCircle, PauseCircle, SkipNext, SkipPrevious, Replay } from '@mui/icons-material';

// Constants
const PROGRESS_INTERVAL = 100; // ms
const PRELOAD_THRESHOLD = 0.9; // Start preloading next clip when current is 90% complete
const TRANSITION_DURATION = 500; // ms for crossfade between clips

const TimelineViewer = ({ clips = [], onPlaybackComplete }) => {
  // State
  const [playing, setPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);

  // Refs
  const playerRef = useRef(null);
  const nextPlayerRef = useRef(null);
  const urlsRef = useRef({ current: null, next: null });
  const transitionTimeoutRef = useRef(null);

  // Memoized calculations
  const totalDuration = useMemo(() => {
    return clips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0);
  }, [clips]);

  const currentClip = useMemo(() => clips[currentClipIndex], [clips, currentClipIndex]);
  
  const nextClip = useMemo(() => clips[currentClipIndex + 1], [clips, currentClipIndex]);

  // Cleanup function for URL objects
  const cleanupUrls = useCallback(() => {
    if (urlsRef.current.current) {
      URL.revokeObjectURL(urlsRef.current.current);
    }
    if (urlsRef.current.next) {
      URL.revokeObjectURL(urlsRef.current.next);
    }
    urlsRef.current = { current: null, next: null };
  }, []);

  // Initialize or reset playback
  useEffect(() => {
    if (clips.length > 0) {
      setCurrentClipIndex(0);
      setProgress(0);
      setPlaying(false);
      setError(null);
      
      // Clean up existing URLs
      cleanupUrls();

      // Create new URL for current clip
      if (clips[0]?.file) {
        try {
          const url = URL.createObjectURL(clips[0].file);
          urlsRef.current.current = url;
          setCurrentUrl(url);

          // Preload next clip if available
          if (clips[1]?.file) {
            const nextUrl = URL.createObjectURL(clips[1].file);
            urlsRef.current.next = nextUrl;
            setNextUrl(nextUrl);
          }
        } catch (err) {
          setError(`Failed to load video: ${err.message}`);
        }
      }
    }

    return cleanupUrls;
  }, [clips, cleanupUrls]);

  // Handle clip transitions
  const handleClipTransition = useCallback(async () => {
    if (currentClipIndex >= clips.length - 1) {
      setPlaying(false);
      setCurrentClipIndex(0);
      onPlaybackComplete?.();
      return;
    }

    setIsTransitioning(true);
    
    // Move to next clip
    const nextIndex = currentClipIndex + 1;
    setCurrentClipIndex(nextIndex);

    // Clean up current URL and set next URL as current
    if (urlsRef.current.current) {
      URL.revokeObjectURL(urlsRef.current.current);
    }
    urlsRef.current.current = urlsRef.current.next;
    setCurrentUrl(nextUrl);

    // Preload next clip if available
    if (clips[nextIndex + 1]?.file) {
      try {
        const newNextUrl = URL.createObjectURL(clips[nextIndex + 1].file);
        urlsRef.current.next = newNextUrl;
        setNextUrl(newNextUrl);
      } catch (err) {
        console.error('Failed to preload next clip:', err);
      }
    } else {
      urlsRef.current.next = null;
      setNextUrl(null);
    }

    // Handle transition timing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [currentClipIndex, clips, nextUrl, onPlaybackComplete]);

  // Progress handling
  const handleProgress = useCallback(({ played, playedSeconds }) => {
    if (!currentClip || isTransitioning) return;

    const clipDuration = currentClip.endTime - currentClip.startTime;
    const currentTime = currentClip.startTime + played * clipDuration;
    setProgress(currentTime);

    // Handle clip completion
    if (playedSeconds >= clipDuration) {
      handleClipTransition();
    }
    // Preload next clip
    else if (played > PRELOAD_THRESHOLD && nextClip && !nextUrl) {
      try {
        const newNextUrl = URL.createObjectURL(nextClip.file);
        urlsRef.current.next = newNextUrl;
        setNextUrl(newNextUrl);
      } catch (err) {
        console.error('Failed to preload next clip:', err);
      }
    }
  }, [currentClip, isTransitioning, handleClipTransition, nextClip, nextUrl]);

  // Playback controls
  const handlePlayPause = useCallback(() => {
    if (error) return;
    setPlaying(!playing);
  }, [error, playing]);

  const handlePrevClip = useCallback(() => {
    if (currentClipIndex > 0) {
      setCurrentClipIndex(prev => prev - 1);
      setPlaying(false);
    }
  }, [currentClipIndex]);

  const handleNextClip = useCallback(() => {
    if (currentClipIndex < clips.length - 1) {
      handleClipTransition();
      setPlaying(false);
    }
  }, [currentClipIndex, clips.length, handleClipTransition]);

  const handleRestart = useCallback(() => {
    setCurrentClipIndex(0);
    setProgress(0);
    setPlaying(false);
  }, []);

  // Error handling
  const handleError = useCallback((e) => {
    console.error('Playback error:', e);
    setError('Failed to play video. Please try again.');
    setPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupUrls();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [cleanupUrls]);

  // Format time for display
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Empty state
  if (clips.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
      }}>
        <Typography color="text.secondary">No clips in timeline</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        flexGrow: 1, 
        position: 'relative',
        bgcolor: 'black',
      }}>
        {/* Current clip player */}
        {currentUrl && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isTransitioning ? 0 : 1,
            transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`
          }}>
            <ReactPlayer
              ref={playerRef}
              url={currentUrl}
              width="100%"
              height="100%"
              playing={playing && !isTransitioning}
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
          </Box>
        )}

        {/* Next clip player (for smooth transitions) */}
        {nextUrl && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isTransitioning ? 1 : 0,
            transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`
          }}>
            <ReactPlayer
              ref={nextPlayerRef}
              url={nextUrl}
              width="100%"
              height="100%"
              playing={playing && isTransitioning}
              progressInterval={PROGRESS_INTERVAL}
              config={{
                file: {
                  attributes: {
                    crossOrigin: "anonymous"
                  }
                }
              }}
            />
          </Box>
        )}

        {/* Error overlay */}
        {error && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Progress bar */}
      <LinearProgress 
        variant="determinate" 
        value={(progress / totalDuration) * 100} 
        sx={{ 
          height: 4,
          '& .MuiLinearProgress-bar': {
            transition: 'none'
          }
        }}
      />

      {/* Controls */}
      <Box sx={{ 
        p: 2,
        display: 'flex', 
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Restart">
            <IconButton onClick={handleRestart} size="small">
              <Replay />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Clip">
            <span>
              <IconButton 
                onClick={handlePrevClip} 
                disabled={currentClipIndex === 0}
                size="small"
              >
                <SkipPrevious />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={handlePlayPause} disabled={!!error} size="large">
            {playing ? <PauseCircle /> : <PlayCircle />}
          </IconButton>
          <Tooltip title="Next Clip">
            <span>
              <IconButton 
                onClick={handleNextClip}
                disabled={currentClipIndex === clips.length - 1}
                size="small"
              >
                <SkipNext />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: 'text.secondary'
        }}>
          <Typography variant="body2">
            Clip: {currentClipIndex + 1} / {clips.length}
          </Typography>
          <Typography variant="body2">
            {formatTime(progress)} / {formatTime(totalDuration)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineViewer;