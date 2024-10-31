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

// New state/refs for handling multiple sources
const sourceVideosRef = useRef(new Map());
const sourceUrlsRef = useRef(new Map());

const timingValues = useMemo(() => ({
  startTime: clip.startTime,
  endTime: clip.endTime,
  actionStart: action.start,
  actionEnd: action.end,
  resizeDir: clip.resizeDir,
  // Modified to handle multiple sources
  sourceClips: clip.source?.clips || [{ 
    file: clip.file,
    startTime: clip.source?.startTime || 0,
    endTime: clip.source?.endTime,
    duration: clip.source?.duration
  }],
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

  const thumbnailParams = useMemo(() => {
    const timingInfo = calculateCurrentTimes();
    if (!timingInfo) return null;
  
    return {
      clipId: timingValues.clipId,
      currentStart: parseFloat(timingInfo.currentStart.split(':').pop()),
      currentEnd: parseFloat(timingInfo.currentEnd.split(':').pop()),
      width: containerWidth.current
    };
  }, [calculateCurrentTimes, timingValues.clipId]);
  
 // Update calculateCurrentTimes to handle multiple sources
const calculateCurrentTimes = useCallback(() => {
  if (!isInitialized.current || !timingValues.hasMetadata) {
    // ... initialization code remains the same ...
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
  
  // Calculate total duration of all source clips
  const totalSourceDuration = timingValues.sourceClips.reduce((total, source) => 
    total + (source.endTime - source.startTime), 0
  );
  
  // Clamp to total source duration
  currentEnd = Math.min(currentEnd, totalSourceDuration);
  currentStart = Math.max(currentStart, 0);

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
        duration: currentEnd - currentStart,
        sourceClips: timingValues.sourceClips.map(source => ({
          id: source.id,
          inPoint: source.startTime,
          outPoint: source.endTime
        }))
      }
    }
  });

  return {
    timelinePosition: formatTime(timingValues.actionStart),
    originalStart: formatTime(originalValues.current.startTime),
    originalEnd: formatTime(originalValues.current.endTime),
    currentStart: formatTime(currentStart),
    currentEnd: formatTime(currentEnd),
    duration: formatTime(currentEnd - currentStart),
    originalDuration: formatTime(originalValues.current.duration)
  };
}, [timingValues]);

  // Function to get the correct source video for a given time
  const getSourceForTime = useCallback((globalTime) => {
    if (!timingValues.sourceClips || timingValues.sourceClips.length === 1) {
      return {
        video: videoRef.current,
        time: globalTime,
        source: timingValues.sourceClips[0]
      };
    }

    let accumulatedTime = 0;
    for (const source of timingValues.sourceClips) {
      const clipDuration = source.endTime - source.startTime;
      if (globalTime >= accumulatedTime && globalTime < accumulatedTime + clipDuration) {
        return {
          video: sourceVideosRef.current.get(source.id),
          time: source.startTime + (globalTime - accumulatedTime),
          source
        };
      }
      accumulatedTime += clipDuration;
    }

    // Default to first source if time not found
    return {
      video: sourceVideosRef.current.get(timingValues.sourceClips[0].id),
      time: timingValues.sourceClips[0].startTime,
      source: timingValues.sourceClips[0]
    };
  }, [timingValues.sourceClips]);

  // Modified thumbnail generation to handle multiple sources
  const generateThumbnails = useCallback(async () => {
    if (!thumbnailParams) return;
    
    const { clipId, currentStart, currentEnd, width } = thumbnailParams;
    const cacheKey = `${clipId}-${currentStart}-${currentEnd}-${width}`;

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
      const newThumbnails = [];
      const thumbnailCount = getThumbnailCount();
      const duration = currentEnd - currentStart;

      // Wait for all videos to be loaded
      await Promise.all(timingValues.sourceClips.map(source => 
        new Promise((resolve, reject) => {
          const video = sourceVideosRef.current.get(source.id);
          if (!video) reject(new Error('Video not found'));
          if (video.readyState >= 2) resolve();
          else {
            video.addEventListener('loadeddata', resolve, { once: true });
            video.addEventListener('error', (e) => reject(new Error(`Video load failed: ${e.message}`)), { once: true });
          }
        })
      ));

      for (let i = 0; i < thumbnailCount; i++) {
        const progress = i / (thumbnailCount - 1);
        const timeOffset = progress * duration;
        const globalTime = currentStart + timeOffset;
        
        // Get correct source video for this time
        const { video, time } = getSourceForTime(globalTime);
        
        video.currentTime = time;
        
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
  }, [thumbnailParams, getThumbnailCount, timingValues.sourceClips, getSourceForTime]);

  // Initialize container width
  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  }, []);

  // Handle video source
  useEffect(() => {
    // Cleanup old URLs
    sourceUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    sourceUrlsRef.current.clear();
    
    // Create video elements and URLs for each source
    timingValues.sourceClips.forEach(source => {
      if (source.file) {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        
        const url = URL.createObjectURL(source.file);
        video.src = url;
        
        sourceVideosRef.current.set(source.id, video);
        sourceUrlsRef.current.set(source.id, url);
      }
    });

    generateThumbnails();

    return () => {
      sourceUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      sourceUrlsRef.current.clear();
      sourceVideosRef.current.clear();
    };
  }, [timingValues.sourceClips, generateThumbnails]);
  
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