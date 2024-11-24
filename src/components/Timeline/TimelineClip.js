import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Skeleton, Tooltip, Typography } from '@mui/material';
import { AlertCircle } from 'lucide-react';

const thumbnailCacheByClip = new Map();
const THUMBNAIL_WIDTH = 80;

const TimelineClip = ({ 
  clip, 
  action, 
  isSelected, 
  onSelect
}) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  const containerRef = useRef(null);
  const containerWidth = useRef(null);
  const isInitialized = useRef(false);
  const initialTimelineStart = useRef(null);
  const lastThumbnailKey = useRef(null);
 // Add this ref to store original values
 const originalValues = useRef({
  startTime: clip.startTime,
  endTime: clip.endTime,
  duration: clip.endTime - clip.startTime
});

const onUpdateData = useCallback((newData) => {
  action.data = newData;
}, [action]);

const timingValues = useMemo(() => ({
  startTime: clip.startTime,
  endTime: clip.endTime,
  actionStart: action.start,
  actionEnd: action.end,
  resizeDir: clip.resizeDir,
  sourceStartTime: clip.source?.startTime || 0,
  sourceEndTime: clip.source?.endTime,
  clipId: clip.id,
  metadata: clip.metadata,
  hasMetadata: Boolean(clip.metadata?.timeline),
  clipData: clip,
  updateData: onUpdateData,
}), [
  clip,
  action.start,
  action.end,
  onUpdateData,
]);

  const getThumbnailCount = useCallback(() => {
    if (!containerWidth.current) return 5;
    return Math.max(3, Math.ceil(containerWidth.current / THUMBNAIL_WIDTH));
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const calculateCurrentTimes = useCallback(() => {
    if (!isInitialized.current || !timingValues.hasMetadata) {
      isInitialized.current = true;
      initialTimelineStart.current = timingValues.actionStart;
      
      timingValues.updateData({
        ...timingValues.clipData,
        metadata: {
          timeline: {
            start: timingValues.actionStart,
            end: timingValues.actionEnd,
            duration: timingValues.actionEnd - timingValues.actionStart,
            initialStart: timingValues.actionStart
          },
          playback: {
            start: timingValues.startTime,
            end: timingValues.endTime,
            duration: timingValues.endTime - timingValues.startTime
          }
        }
      });

      return {
        timelinePosition: formatTime(timingValues.actionStart),
        originalStart: formatTime(originalValues.current.startTime),  // Use ref values
        originalEnd: formatTime(originalValues.current.endTime),      // Use ref values
        currentStart: formatTime(timingValues.startTime),
        currentEnd: formatTime(timingValues.endTime),
        duration: formatTime(timingValues.endTime - timingValues.startTime),
        originalDuration: formatTime(originalValues.current.duration) // Use ref value
      };
    }

    let currentStart = timingValues.startTime;
    let currentEnd = timingValues.endTime;

    if (timingValues.resizeDir === 'left') {
      currentEnd = timingValues.endTime;
      const newDuration = timingValues.actionEnd - timingValues.actionStart;
      currentStart = timingValues.endTime - newDuration;
    } else if (timingValues.resizeDir === 'right') {
      currentStart = timingValues.startTime;
      const newDuration = timingValues.actionEnd - timingValues.actionStart;
      currentEnd = timingValues.startTime + newDuration;
    }
    
    currentEnd = Math.min(currentEnd, timingValues.sourceEndTime);
    currentStart = Math.max(currentStart, timingValues.sourceStartTime);

    timingValues.updateData({
      ...timingValues.clipData,
      startTime: currentStart,
      endTime: currentEnd,
      metadata: {
        timeline: {
          start: timingValues.actionStart,
          end: timingValues.actionEnd,
          duration: timingValues.actionEnd - timingValues.actionStart,
          initialStart: timingValues.metadata?.timeline?.initialStart || initialTimelineStart.current
        },
        playback: {
          start: currentStart,
          end: currentEnd,
          duration: currentEnd - currentStart
        }
      }
    });

    return {
      timelinePosition: formatTime(timingValues.actionStart),
      originalStart: formatTime(originalValues.current.startTime),  // Use ref values
      originalEnd: formatTime(originalValues.current.endTime),      // Use ref values
      currentStart: formatTime(currentStart),
      currentEnd: formatTime(currentEnd),
      duration: formatTime(currentEnd - currentStart),
      originalDuration: formatTime(originalValues.current.duration) // Use ref value
    };
  }, [timingValues]); 

  const parseTimeString = (timeStr) => {
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return (minutes * 60) + seconds;
  };
  
  const thumbnailParams = useMemo(() => {
    const timingInfo = calculateCurrentTimes();
    if (!timingInfo) return null;
  
    return {
      clipId: timingValues.clipId,
      currentStart: parseTimeString(timingInfo.currentStart),
      currentEnd: parseTimeString(timingInfo.currentEnd),
      width: containerWidth.current
    };
  }, [calculateCurrentTimes, timingValues.clipId]);

  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !clip.file || !thumbnailParams) return;
    
    const { clipId, currentStart, currentEnd, width } = thumbnailParams;
    const cacheKey = `${clipId}-${currentStart}-${currentEnd}-${width}`;

    // Skip if we're already showing these thumbnails
    if (lastThumbnailKey.current === cacheKey) return;
    
    if (thumbnailCacheByClip.has(cacheKey)) {
      lastThumbnailKey.current = cacheKey;
      setThumbnails(thumbnailCacheByClip.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
        const progress = i / (thumbnailCount - 1);
        const timeOffset = progress * duration;
        const sourceTime = currentStart + timeOffset;
        
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
      
      lastThumbnailKey.current = cacheKey;
      thumbnailCacheByClip.set(cacheKey, newThumbnails);
      setThumbnails(newThumbnails);

    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clip.file, getThumbnailCount, thumbnailParams]);

  // Initialize container width
  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  }, []);

  // Handle video source
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

  // Handle resize with debouncing
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth !== containerWidth.current) {
          containerWidth.current = newWidth;
          generateThumbnails();
        }
      }
    };

    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, [generateThumbnails]);

  // Generate thumbnails on essential changes
  useEffect(() => {
    if (thumbnailParams) {
      generateThumbnails();
    }
  }, [thumbnailParams, generateThumbnails]);

  // Clean up clip-specific cache
  useEffect(() => {
    if (thumbnailCacheByClip.size > 50) {
      const clipPrefix = `${timingValues.clipId}-`;
      const entriesToRemove = Array.from(thumbnailCacheByClip.keys())
        .filter(key => key.startsWith(clipPrefix))
        .slice(0, 20);
      entriesToRemove.forEach(key => thumbnailCacheByClip.delete(key));
    }
    
    return () => {
      const clipPrefix = `${timingValues.clipId}-`;
      for (const key of thumbnailCacheByClip.keys()) {
        if (key.startsWith(clipPrefix)) {
          thumbnailCacheByClip.delete(key);
        }
      }
    };
  }, [timingValues.clipId]);

  // Update hover info
  useEffect(() => {
    setHoverInfo(calculateCurrentTimes());
  }, [calculateCurrentTimes]);

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
