import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Skeleton, Tooltip, Typography } from '@mui/material';
import { AlertCircle } from 'lucide-react';
import { useTimelineStateManager, CLIP_STATES } from '../../hooks/useTimeline/useTimelineStateManager';

const thumbnailCache = new Map();
const THUMBNAIL_WIDTH = 80;

const TimelineClip = ({ 
  clip, 
  action, 
  isSelected, 
  onSelect
}) => {
  const {
    manager,
    startClipModification,
    moveClip,
    trimClip,
    completeModification
  } = useTimelineStateManager();

  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate number of thumbnails based on container width
  const getThumbnailCount = useCallback(() => {
    if (!containerRef.current) return 5;
    const width = containerRef.current.offsetWidth;
    return Math.max(3, Math.ceil(width / THUMBNAIL_WIDTH));
  }, []);

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get timing info from state manager
  const calculateCurrentTimes = useCallback(() => {
    const clipState = manager.clips.get(clip.id);
    if (clipState) {
      const timingInfo = clipState.getTimingInfo();
      return {
        timelinePosition: formatTime(timingInfo.timelinePosition),
        originalStart: formatTime(timingInfo.originalIn),
        originalEnd: formatTime(timingInfo.originalOut),
        currentStart: formatTime(timingInfo.currentIn),
        currentEnd: formatTime(timingInfo.currentOut),
        duration: formatTime(timingInfo.duration),
        originalDuration: formatTime(timingInfo.originalOut - timingInfo.originalIn)
      };
    }
  
    // Fallback to direct calculation if no state available
    const originalStart = clip.startTime || 0;
    const originalEnd = clip.endTime || 0;
    const timelineStart = action.start || 0;
    const timelineDuration = action.end - action.start;
    const originalDuration = originalEnd - originalStart;
    
    // Determine if we're trimming from left side
    const isLeftTrim = timelineStart !== clip.timelineStartTime;
    
    let currentStart, currentEnd;
    if (isLeftTrim) {
      // When trimming from left, keep end fixed
      currentEnd = originalEnd;
      currentStart = originalEnd - timelineDuration;
    } else {
      // When trimming from right, keep start fixed
      currentStart = originalStart;
      currentEnd = originalStart + timelineDuration;
    }
    
    return {
      timelinePosition: formatTime(timelineStart),
      originalStart: formatTime(originalStart),
      originalEnd: formatTime(originalEnd),
      currentStart: formatTime(currentStart),
      currentEnd: formatTime(currentEnd),
      duration: formatTime(timelineDuration),
      originalDuration: formatTime(originalDuration)
    };
  }, [clip, action, manager.clips]);

  // Update state manager when clip position changes
  useEffect(() => {
    const clipState = manager.clips.get(clip.id);
    if (clipState && action.start !== clipState.timelineStartTime) {
      startClipModification(clip.id, CLIP_STATES.MOVING);
      moveClip(clip.id, action.start);
      completeModification(clip.id);
    }
  }, [action.start, clip.id, manager.clips, startClipModification, moveClip, completeModification]);

  // Update state manager when clip duration changes
  useEffect(() => {
    const clipState = manager.clips.get(clip.id);
    if (clipState && (action.end - action.start) !== clipState.timelineDuration) {
      startClipModification(clip.id, CLIP_STATES.TRIMMING);
      trimClip(clip.id, action.start, action.end);
      completeModification(clip.id);
    }
  }, [action.start, action.end, clip.id, manager.clips, startClipModification, trimClip, completeModification]);

  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !clip.file || !containerRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get clip state for accurate timing
      const timingInfo = calculateCurrentTimes();
      if (!timingInfo) return;

      // Parse times removing formatting
      const currentStart = parseFloat(timingInfo.currentStart.split(':').pop());
      const currentEnd = parseFloat(timingInfo.currentEnd.split(':').pop());
      const originalStart = parseFloat(timingInfo.originalStart.split(':').pop());
      
      // Update cache key to include current timing
      const cacheKey = `${clip.file.name}-${currentStart}-${currentEnd}-${containerRef.current.offsetWidth}`;
      
      if (thumbnailCache.has(cacheKey)) {
        setThumbnails(thumbnailCache.get(cacheKey));
        setLoading(false);
        return;
      }

      const video = videoRef.current;
      const newThumbnails = [];
      
      await new Promise((resolve, reject) => {
        const handleLoad = () => resolve();
        const handleError = (e) => reject(new Error(`Video load failed: ${e.message}`));
        
        if (video.readyState >= 2) resolve();
        else {
          video.addEventListener('loadeddata', handleLoad, { once: true });
          video.addEventListener('error', handleError, { once: true });
        }
      });

      const thumbnailCount = getThumbnailCount();
      const duration = currentEnd - currentStart;
      
      for (let i = 0; i < thumbnailCount; i++) {
        // Calculate position within the current segment
        const progress = i / (thumbnailCount - 1);
        const timeOffset = progress * duration;
        
        // Map to source video time
        const sourceTime = currentStart + timeOffset;
        
        // Set video to the source time position
        video.currentTime = sourceTime;
        
        await new Promise((resolve) => {
          video.addEventListener('seeked', resolve, { once: true });
        });

        const canvas = document.createElement('canvas');
        const scale = Math.min(1, THUMBNAIL_WIDTH / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        newThumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
      }
      
      thumbnailCache.set(cacheKey, newThumbnails);
      setThumbnails(newThumbnails);

    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clip.file, calculateCurrentTimes, getThumbnailCount]);

  // Handle video source and thumbnail generation
  useEffect(() => {
    if (videoRef.current && clip.file) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(clip.file);
      videoRef.current.src = videoUrlRef.current;
      
      generateThumbnails();
    }

    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, [clip.file, generateThumbnails]);

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      generateThumbnails();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [generateThumbnails]);

  // Add effect to regenerate thumbnails on clip changes
  useEffect(() => {
    generateThumbnails();
  }, [clip.startTime, clip.endTime, action.start, action.end, generateThumbnails]);

  // Cache cleanup
  useEffect(() => {
    if (thumbnailCache.size > 50) {
      const entriesToRemove = Array.from(thumbnailCache.keys()).slice(0, 20);
      entriesToRemove.forEach(key => thumbnailCache.delete(key));
    }
  }, [thumbnails]);

  // Update hover info whenever the clip position or duration changes
  useEffect(() => {
    setHoverInfo(calculateCurrentTimes());
  }, [action.start, action.end, calculateCurrentTimes]);

  const tooltipContent = () => (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Timeline Position: {hoverInfo?.timelinePosition}
      </Typography>
      <Typography variant="caption" display="block">
        Current In/Out: {hoverInfo?.currentStart} - {hoverInfo?.currentEnd}
      </Typography>
      <Typography variant="caption" display="block">
        Original In/Out: {hoverInfo?.originalStart} - {hoverInfo?.originalEnd}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
        Current Duration: {hoverInfo?.duration}
      </Typography>
      <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
        Original Duration: {hoverInfo?.originalDuration}
      </Typography>
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent()}
      followCursor
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.85)',
            '& .MuiTooltip-arrow': {
              color: 'rgba(0, 0, 0, 0.85)',
            },
          },
        },
      }}
    >
      <Box
        ref={containerRef}
        onClick={() => onSelect?.(action.id)}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          bgcolor: 'black',
          borderRadius: 1,
          border: theme => `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.grey[700]}`,
          overflow: 'hidden',
          '&:hover': {
            borderColor: theme => isSelected ? theme.palette.primary.main : theme.palette.grey[500],
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            Array.from({ length: getThumbnailCount() }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                sx={{
                  flex: 1,
                  height: '100%',
                  bgcolor: 'grey.900'
                }}
              />
            ))
          ) : error ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.900',
                color: 'error.main'
              }}
            >
              <AlertCircle size={24} />
            </Box>
          ) : (
            thumbnails.map((thumbnail, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: '100%',
                  position: 'relative',
                  borderRight: index < thumbnails.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}
              >
                <img
                  src={thumbnail}
                  alt={`Frame ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            ))
          )}
        </Box>
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          muted
          playsInline
        />
      </Box>
    </Tooltip>
  );
};

export default TimelineClip;