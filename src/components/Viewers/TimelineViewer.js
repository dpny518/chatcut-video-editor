// src/components/Viewers/TimelineViewer.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from 'video-react';
import 'video-react/dist/video-react.css';
import { Box, Button } from '@mui/material';
import { PlayCircle, PauseCircle, SkipBack } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

const TimelineViewer = ({ clips = [], transcriptData = [] }) => {
  const [timelineTime, setTimelineTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSourceTime, setCurrentSourceTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);
  
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const currentClipRef = useRef(null);
  const sourceUrlRef = useRef(null);

  // Calculate total duration considering both regular and merged clips
  const duration = clips.reduce((max, clip) => {
    const end = clip.metadata?.timeline?.end || (clip.startTime + clip.duration);
    return Math.max(max, end);
  }, 0);

  // Enhanced getActiveClip to handle both merged and single clips
  const getActiveClip = useCallback((time) => {
    for (const clip of clips) {
      const timelineStart = clip.metadata?.timeline?.start || 0;
      const timelineEnd = clip.metadata?.timeline?.end || (timelineStart + clip.duration);
      
      if (time >= timelineStart && time <= timelineEnd) {
        // Handle merged clips with segments
        if (clip.metadata?.sources) {
          let accumulatedTime = timelineStart;
          for (const source of clip.metadata.sources) {
            const sourceDuration = source.duration;
            if (time < accumulatedTime + sourceDuration) {
              const sourceProgress = (time - accumulatedTime) / sourceDuration;
              return {
                clip: source,
                sourceTime: source.startTime + (sourceProgress * sourceDuration),
                timelineStart: accumulatedTime,
                timelineEnd: accumulatedTime + sourceDuration,
                file: source.file,
                isMerged: true
              };
            }
            accumulatedTime += sourceDuration;
          }
        }
        
        // Handle regular clips
        const clipProgress = (time - timelineStart) / (timelineEnd - timelineStart);
        return {
          clip,
          sourceTime: clip.startTime + (clipProgress * clip.duration),
          timelineStart,
          timelineEnd,
          file: clip.file,
          isMerged: false
        };
      }
    }
    return null;
  }, [clips]);

  // Update source URL management
  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
    };
  }, []);

  
  const updateVideoSource = useCallback((activeClip) => {
    if (!activeClip || !playerRef.current) return;

    // Only create new URL if source has changed
    if (!currentSource || currentSource.id !== activeClip.clip.id) {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      sourceUrlRef.current = URL.createObjectURL(activeClip.file);
      setCurrentSource(activeClip.clip);
      
      // Update player source
      const player = playerRef.current;
      player.load();
      player.seek(activeClip.sourceTime);
      if (isPlaying) {
        player.play();
      }
    }
  }, [isPlaying]);
  const getTranscriptOverlay = useCallback(() => {
    if (!transcriptData || !currentClipRef.current) return null;
  
    let currentWords = [];
    const activeClip = currentClipRef.current;
  
    if (activeClip.isMerged) {
      // Handle merged clip transcripts
      const sourceTranscript = transcriptData.get(activeClip.clip.name.replace(/\.[^/.]+$/, '.json'));
      if (sourceTranscript?.transcription) {
        sourceTranscript.transcription.forEach(segment => {
          segment.words.forEach(word => {
            if (word.start <= currentSourceTime && word.end > currentSourceTime) {
              currentWords.push({
                ...word,
                speaker: segment.segment.speaker
              });
            }
          });
        });
      }
    } else {
      // Handle single clip transcripts
      const transcript = transcriptData.get(activeClip.clip.name.replace(/\.[^/.]+$/, '.json'));
      if (transcript?.transcription) {
        transcript.transcription.forEach(segment => {
          segment.words.forEach(word => {
            if (word.start <= currentSourceTime && word.end > currentSourceTime) {
              currentWords.push({
                ...word,
                speaker: segment.segment.speaker
              });
            }
          });
        });
      }
    }
  
    if (currentWords.length === 0) return null;
  
    return (
      <div className="subtitle-overlay">
        <style>
          {`
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
    );
  }, [transcriptData, currentSourceTime]);
  
  // Timeline animation
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

  // Handle player state changes
  useEffect(() => {
    if (!playerRef.current) return;

    const activeClip = getActiveClip(timelineTime);
    if (activeClip) {
      updateVideoSource(activeClip);
      currentClipRef.current = activeClip;
    }
  }, [timelineTime, getActiveClip, updateVideoSource]);

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
          updateVideoSource(nextClipInfo);
          currentClipRef.current = nextClipInfo;
        }
      }
    };

    playerRef.current.subscribeToStateChange(handleStateChange);
  }, [isPlaying, getActiveClip, hasEnded, updateVideoSource]);

  // Player controls
  const handlePlay = () => {
    setHasEnded(false);
    const activeClip = getActiveClip(timelineTime);
    if (activeClip) {
      updateVideoSource(activeClip);
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
      updateVideoSource(firstClip);
    }
  };

  // Render
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
          `}
        </style>
        <Player
          ref={playerRef}
          autoPlay={false}
          fluid={true}
          playsInline
        >
          {sourceUrlRef.current && (
            <source src={sourceUrlRef.current} />
          )}
        </Player>

        {/* Transcript overlay */}
        {currentClipRef.current && getTranscriptOverlay()}
      </div>

      {/* Controls */}
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
          {formatTime(timelineTime)} / {formatTime(duration)}
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineViewer;