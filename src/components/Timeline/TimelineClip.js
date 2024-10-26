import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Skeleton, Tooltip, Typography, Badge } from '@mui/material';
import { AlertCircle, Link, ExternalLink } from 'lucide-react';

const thumbnailCacheByClip = new Map();
const THUMBNAIL_WIDTH = 80;

const TimelineClip = ({ 
  clip, 
  action, 
  isSelected, 
  onSelect,
  isReference = false,
  referenceData = null,
  onNavigateToSource,
  disabled = false
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

const timingValues = useMemo(() => {
  const baseValues = {
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
  };

  // Add reference-specific data
  if (isReference && referenceData) {
    return {
      ...baseValues,
      referenceType: referenceData.sourceType,
      referenceSourceId: referenceData.sourceId,
      referenceStart: referenceData.sourceStart,
      referenceEnd: referenceData.sourceEnd,
      needsUpdate: referenceData.needsUpdate,
    };
  }

  return baseValues;
}, [
  clip,
  action.start,
  action.end,
  onUpdateData,
  isReference,
  referenceData,
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

  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || (!clip.file && !isReference) || !thumbnailParams) return;
    
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

      // Handle video source based on reference type
      if (isReference && referenceData) {
        // For timeline references, get the source video from the reference data
        if (referenceData.sourceType === 'timeline') {
          if (!referenceData.sourceUrl) {
            throw new Error('Source video not available for reference');
          }
          video.src = referenceData.sourceUrl;
        } else {
          // For bin references, use the original file
          video.src = videoUrlRef.current;
        }
      } else {
        // For regular clips, use the clip's file
        video.src = videoUrlRef.current;
      }
      
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
      
      // Adjust source times based on reference
      const sourceOffset = isReference ? (referenceData?.sourceStart || 0) : 0;
      
      for (let i = 0; i < thumbnailCount; i++) {
        const progress = i / (thumbnailCount - 1);
        const timeOffset = progress * duration;
        const sourceTime = sourceOffset + currentStart + timeOffset;
        
        video.currentTime = sourceTime;
        
        await new Promise((resolve) => {
          video.addEventListener('seeked', resolve, { once: true });
        });

        const canvas = document.createElement('canvas');
        const scale = Math.min(1, THUMBNAIL_WIDTH / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        
        // Apply any reference-specific transformations
        if (isReference && referenceData?.transform) {
          ctx.save();
          if (referenceData.transform.flip) ctx.scale(-1, 1);
          if (referenceData.transform.rotate) ctx.rotate(referenceData.transform.rotate);
          // Add more transformations as needed
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Add reference indicator if needed
        if (isReference) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, 20, 20);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(5, 10);
          ctx.lineTo(15, 10);
          ctx.moveTo(10, 5);
          ctx.lineTo(10, 15);
          ctx.stroke();
        }
        
        newThumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
      }
      
      // Cache with reference-specific key
      const finalCacheKey = isReference ? `ref-${cacheKey}` : cacheKey;
      lastThumbnailKey.current = finalCacheKey;
      thumbnailCacheByClip.set(finalCacheKey, newThumbnails);
      setThumbnails(newThumbnails);

    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setError(err.message);
      
      // Set placeholder thumbnails for failed references
      if (isReference) {
        const placeholderThumbnails = Array(getThumbnailCount()).fill(null);
        setThumbnails(placeholderThumbnails);
      }
    } finally {
      setLoading(false);
    }
  }, [
    clip.file,
    getThumbnailCount,
    thumbnailParams,
    isReference,
    referenceData,
    videoUrlRef.current
  ]);

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
        onClick={() => !disabled && onSelect?.(action.id)}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: 'black',
          borderRadius: 1,
          border: theme => {
            if (disabled) return `2px solid ${theme.palette.grey[800]}`;
            if (isSelected) return `2px solid ${theme.palette.primary.main}`;
            if (isReference) return `2px solid ${theme.palette.info.main}`;
            return `2px solid ${theme.palette.grey[700]}`;
          },
          opacity: disabled ? 0.7 : 1,
          overflow: 'hidden',
          '&:hover': {
            borderColor: theme => {
              if (disabled) return theme.palette.grey[800];
              if (isSelected) return theme.palette.primary.main;
              if (isReference) return theme.palette.info.light;
              return theme.palette.grey[500];
            },
          }
        }}
      >
        {/* Reference Indicator */}
        {isReference && (
          <Badge
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 1,
            }}
            badgeContent={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  p: 0.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Link size={14} />
                {referenceData?.needsUpdate && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                    }}
                  />
                )}
              </Box>
            }
          >
            {onNavigateToSource && (
              <Tooltip title="Go to Source">
                <ExternalLink
                  size={16}
                  className="cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToSource(referenceData?.sourceId, referenceData?.sourceClipId);
                  }}
                />
              </Tooltip>
            )}
          </Badge>
        )}

        {/* Thumbnail Container */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                bgcolor: 'grey.900',
                color: 'error.main',
                p: 2,
              }}
            >
              <AlertCircle size={24} />
              <Typography
                variant="caption"
                color="error"
                sx={{ textAlign: 'center' }}
              >
                {isReference ? 'Reference source unavailable' : 'Error loading thumbnails'}
              </Typography>
            </Box>
          ) : (
            <>
              {thumbnails.map((thumbnail, index) => (
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
              ))}
              
              {/* Reference Overlay */}
              {isReference && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(rgba(0,0,0,0) 80%, rgba(0,0,0,0.6) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.7rem',
                    }}
                  >
                    <Link size={12} />
                    {referenceData?.sourceName || 'Referenced Clip'}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Video Element (hidden) */}
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          muted
          playsInline
          crossOrigin="anonymous"
        />

        {/* Loading Overlay */}
        {isReference && loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="white">
              Loading reference...
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default TimelineClip;