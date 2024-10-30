import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from 'video-react';
import 'video-react/dist/video-react.css';
import { Box, Button } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';

const TimelineViewer = ({ clips = [], transcriptData = [] }) => {
  const [timelineTime, setTimelineTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSourceTime, setCurrentSourceTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const currentClipRef = useRef(null);

  const duration = clips.reduce((max, clip) => {
    const end = clip.metadata?.timeline?.end || (clip.startTime + clip.duration);
    return Math.max(max, end);
  }, 0);

  const getActiveClip = useCallback((time) => {
    for (const clip of clips) {
      const timelineStart = clip.metadata?.timeline?.start || 0;
      const timelineEnd = clip.metadata?.timeline?.end || (timelineStart + clip.duration);
      
      if (time >= timelineStart && time <= timelineEnd) {
        const clipProgress = (time - timelineStart) / (timelineEnd - timelineStart);
        const sourceTime = clip.startTime + (clipProgress * clip.duration);
        
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

  const getCurrentWords = useCallback(() => {
    if (!transcriptData || !(transcriptData instanceof Map)) return [];
    
    const activeClip = getActiveClip(timelineTime);
    if (!activeClip) return [];

    const transcriptEntry = Array.from(transcriptData.values())[0];
    if (!transcriptEntry?.transcription) return [];

    const currentWords = [];
    transcriptEntry.transcription.forEach(segment => {
      segment.words.forEach(word => {
        if (word.start <= currentSourceTime && word.end > currentSourceTime) {
          currentWords.push({
            ...word,
            speaker: segment.segment.speaker
          });
        }
      });
    });

    return currentWords;
  }, [transcriptData, timelineTime, currentSourceTime, getActiveClip]);

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
          setHasEnded(true);
          setTimelineTime(0);
          if (playerRef.current) {
            playerRef.current.pause();
            playerRef.current.seek(0);
          }
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

  useEffect(() => {
    if (!playerRef.current) return;

    const activeClip = getActiveClip(timelineTime);
    const player = playerRef.current;
    
    if (activeClip) {
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
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

  useEffect(() => {
    if (!playerRef.current) return;

    const handleStateChange = (state) => {
      setCurrentSourceTime(state.currentTime);
      
      if (!currentClipRef.current) return;

      const activeClip = currentClipRef.current;
      if (state.currentTime >= activeClip.clip.endTime) {
        playerRef.current.pause();
        
        const nextClipInfo = getActiveClip(activeClip.timelineEnd + 0.1);
        if (nextClipInfo && !hasEnded) {
          playerRef.current.seek(nextClipInfo.sourceTime);
          currentClipRef.current = nextClipInfo;
          if (isPlaying) {
            playerRef.current.play();
          }
        }
      }
    };

    playerRef.current.subscribeToStateChange(handleStateChange);
  }, [isPlaying, getActiveClip, hasEnded]);

  const handlePlay = () => {
    setHasEnded(false);
    const activeClip = getActiveClip(timelineTime);
    if (activeClip) {
      if (!currentClipRef.current || currentClipRef.current.clip.id !== activeClip.clip.id) {
        playerRef.current.seek(activeClip.sourceTime);
        currentClipRef.current = activeClip;
      }
      playerRef.current.play();
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
    setHasEnded(false);
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

  const currentWords = getCurrentWords();

  if (!clips.length) {
    return <div>No clips loaded</div>;
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="video-player-wrapper" style={{ position: 'relative' }}>
        <style>
          {`
            .video-player-wrapper .video-react-control-bar {
              display: none !important;
            }
            .video-player-wrapper .video-react-big-play-button {
              display: none !important;
            }
            .video-react {
              position: relative;
            }
            .subtitle-overlay {
              position: absolute;
              bottom: 80px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 1;
              background-color: rgba(0, 0, 0, 0.7);
              padding: 8px 16px;
              border-radius: 4px;
              text-align: center;
              min-width: 200px;
              max-width: 80%;
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
        
        {currentWords.length > 0 && (
          <div className="subtitle-overlay">
            <span style={{ color: 'white', fontSize: '1.2em', lineHeight: '1.4' }}>
              {currentWords.map((word, index) => (
                <span 
                  key={index}
                  style={{ 
                    marginLeft: '4px',
                    marginRight: '4px'
                  }}
                >
                  {word.word}
                </span>
              ))}
            </span>
          </div>
        )}
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
    </Box>
  );
};

export default TimelineViewer;