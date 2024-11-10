import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Alert, CircularProgress, Button } from '@mui/material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';

// Constants
const MIN_CLIP_DURATION = 1; // minimum clip duration in seconds
const SEEK_DEBOUNCE_MS = 100; // debounce delay for seeking
const PROGRESS_INTERVAL = 100; // progress update interval in ms

const BinViewer = ({ 
  clips, 
  selectedClips,
  onAddToTimeline, 
  setTimelineRows,
  masterClipManager,
  mergedContent
}) => {
  // State management
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  // Refs
  const playerRef = useRef(null);
  const urlRef = useRef(null);



  // Determine active clip (single or merged)
  const activeClip = useMemo(() => {
    // Check if we have selectedClips and mergedContent
    if (!selectedClips?.length) return null;

    if (mergedContent && selectedClips.length > 1) {
      return {
        file: selectedClips[0].file,
        name: `Merged (${selectedClips.length} clips)`,
        duration: mergedContent.totalDuration || 0,
        isMerged: true,
        ranges: mergedContent.ranges || []
      };
    }

    // Single clip case
    return selectedClips[0] || null;
  }, [selectedClips, mergedContent]);

  // Cleanup function for URL objects
  const cleanupVideoUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Handle video loading
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (activeClip?.file) {
      try {
        cleanupVideoUrl();
        urlRef.current = URL.createObjectURL(activeClip.file);
        setVideoUrl(urlRef.current);
        setPlaying(false);
        setCurrentTime(0);
        setRange([0, activeClip.isMerged ? activeClip.duration : 0]);
      } catch (err) {
        setError(`Failed to load video: ${err.message}`);
      }
    } else {
      setVideoUrl(null);
    }

    setLoading(false);
    return cleanupVideoUrl;
  }, [activeClip, cleanupVideoUrl]);


  useEffect(() => {
    const loadedVideos = new Set();
  
    selectedClips.forEach(clip => {
      if (clip?.file && !loadedVideos.has(clip.name)) {
        loadedVideos.add(clip.name);
        const video = document.createElement('video');
        
        video.addEventListener('loadedmetadata', () => {
          try {
            masterClipManager.setVideoDuration(clip.name, video.duration);
            console.log('Set duration for:', clip.name, video.duration);
          } catch (error) {
            console.error('Error setting video duration:', error);
            setError(`Failed to process ${clip.name}: ${error.message}`);
          } finally {
            URL.revokeObjectURL(video.src);
          }
        });
  
        video.addEventListener('error', (e) => {
          console.error('Error loading video:', e);
          setError(`Failed to load ${clip.name}`);
          URL.revokeObjectURL(video.src);
        });
  
        video.src = URL.createObjectURL(clip.file);
      }
    });
  
    return () => loadedVideos.clear();
  }, [selectedClips, masterClipManager]);

  // Debounced seek function
  const debouncedSeek = useCallback(
    debounce((time) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
      }
    }, SEEK_DEBOUNCE_MS),
    []
  );


  // Event handlers
  const handlePlayPause = () => {
    if (error) return;
    setPlaying(!playing);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    setRange([0, duration]);
  };

  const handleProgress = useCallback(
    state => {
      setCurrentTime(state.playedSeconds);
      if (state.playedSeconds >= range[1]) {
        setPlaying(false);
        debouncedSeek(range[0]);
      }
    },
    [range, debouncedSeek]
  );

  const handleRangeChange = (event, newValue) => {
    const [start, end] = newValue;
    if (end - start < MIN_CLIP_DURATION) return;
    setRange(newValue);
    debouncedSeek(newValue[0]);
  };

  const handleError = (error) => {
    console.error('Video playback error:', error);
    setError('Failed to play video. Please try again or select a different file.');
    setPlaying(false);
  };

  const findTimelineEndPosition = (clips) => {
    if (!clips.length) return 0;
    return Math.max(...clips.map(clip => clip.metadata?.timeline?.end || 0));
  };

  const handleAddToTimeline = () => {
    if (!activeClip || error) return;
  
    try {
      const clipStart = range[0];
      const clipEnd = range[1];
  
      // Validation
      if (clipEnd <= clipStart) {
        throw new Error('Invalid clip range: end time must be greater than start time');
      }
  
      if (clipEnd - clipStart < MIN_CLIP_DURATION) {
        throw new Error(`Clip must be at least ${MIN_CLIP_DURATION} seconds long`);
      }
  
      console.log('Adding clip to timeline:', {
        activeClip,
        range: [clipStart, clipEnd],
        isMerged: activeClip.isMerged
      });
  
      if (activeClip.isMerged) {
        if (!activeClip.ranges || !activeClip.ranges.length) {
          throw new Error('No ranges available for merged clip');
        }
  
        console.log('Creating merged clip with ranges:', activeClip.ranges);
        const clipData = masterClipManager.createTimelineClip({
          startTime: clipStart,
          endTime: clipEnd,
          ranges: activeClip.ranges,
          type: 'merged'
        });
  
        if (!clipData) {
          throw new Error('Failed to create merged clip');
        }
  
        onAddToTimeline?.(clipData);
      } else {
        // Normal single clip
        const timelineDuration = clipEnd - clipStart;
        const timelineStart = findTimelineEndPosition(clips);
        const timelineEnd = timelineStart + timelineDuration;
        
        if (!activeClip.file) {
          throw new Error('No file available for clip');
        }
  
        const clipData = {
          id: `clip-${Date.now()}`,
          file: activeClip.file,
          name: activeClip.file.name,
          startTime: clipStart,
          endTime: clipEnd,
          duration: timelineDuration,
          source: {
            startTime: 0,
            endTime: duration,
            duration: duration
          },
          metadata: {
            timeline: {
              start: timelineStart,
              end: timelineEnd,
              duration: timelineDuration,
              row: 0
            },
            playback: {
              start: clipStart,
              end: clipEnd,
              duration: timelineDuration
            }
          }
        };
        
        onAddToTimeline?.(clipData);
      }
  
      // Success notification or feedback
      console.log('Successfully added clip to timeline');
      
    } catch (error) {
      console.error('Error adding clip to timeline:', error);
      setError(`Failed to add clip: ${error.message}`);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render states
  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" color="primary" onClick={() => setError(null)}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!selectedClips?.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No clips selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      p: 2,
      borderRadius: 1,
    }}>
      <Typography variant="h6" gutterBottom>
        {activeClip.isMerged ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{activeClip.name}</span>
            <Typography variant="body2" color="text.secondary">
              ({formatTime(activeClip.duration)})
            </Typography>
          </Box>
        ) : (
          activeClip.file.name
        )}
      </Typography>

      {activeClip.isMerged && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing merged preview. Select range to create a combined clip.
        </Alert>
      )}

      <Box sx={{ position: 'relative', flexGrow: 1, mb: 2, bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
        {videoUrl && (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={playing}
            onDuration={handleDuration}
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
        )}
      </Box>

      <Box sx={{ 
        mb: 2, 
        px: 1,
        position: 'relative',
        height: '40px'
      }}>
        {/* Gap Indicators */}
        {activeClip.isMerged && mergedContent?.gaps?.map((gap, index) => (
          <Box
            key={`gap-${index}`}
            sx={{
              position: 'absolute',
              left: `${(gap.start / mergedContent.originalTotalDuration) * 100}%`,
              width: `${(gap.duration / mergedContent.originalTotalDuration) * 100}%`,
              height: '4px',
              bottom: '20px',
              bgcolor: 'error.main',
              opacity: 0.5,
              zIndex: 1
            }}
          />
        ))}

        {/* Clip Range Indicators */}
        {activeClip.isMerged && mergedContent?.ranges?.map((range, index) => (
          <Box
            key={`range-${index}`}
            sx={{
              position: 'absolute',
              left: `${(range.continuousStart / mergedContent.totalDuration) * 100}%`,
              width: `${(range.duration / mergedContent.totalDuration) * 100}%`,
              height: '4px',
              bottom: '20px',
              bgcolor: 'primary.main',
              opacity: 0.5,
              zIndex: 2,
              '&::after': {
                content: `"${range.source.filename.split('.')[0]}"`,
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                color: 'text.secondary'
              }
            }}
          />
        ))}

        <Slider
          value={range}
          onChange={handleRangeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          min={0}
          max={duration}
          step={0.1}
          disabled={!duration}
          sx={{
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            }
          }}
        />
        <Box sx={{ position: 'relative', mt: -4, mb: 1, height: 0 }}>
          <Box
            sx={{
              position: 'absolute',
              left: `${(currentTime / duration) * 100}%`,
              transform: 'translateX(-50%)',
              width: '2px',
              height: '16px',
              bgcolor: 'error.main',
              transition: 'left 0.1s linear'
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Selected: {formatTime(range[0])} - {formatTime(range[1])}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({formatTime(range[1] - range[0])})
          </Typography>
        </Typography>
        <Button 
          onClick={handlePlayPause}
          variant="contained"
          size="small"
          disabled={!duration}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
      </Box>

      <Button 
        onClick={handleAddToTimeline}
        variant="contained"
        color="primary"
        disabled={!duration || range[1] - range[0] < MIN_CLIP_DURATION}
        fullWidth
      >
        Add to Timeline
      </Button>
    </Box>
  );
};

BinViewer.propTypes = {
  clips: PropTypes.array,
  selectedClips: PropTypes.array,
  onAddToTimeline: PropTypes.func.isRequired,
  setTimelineRows: PropTypes.func,
  masterClipManager: PropTypes.object.isRequired,
  mergedContent: PropTypes.object
};

BinViewer.defaultProps = {
  clips: [],
  selectedClips: [],
  mergedContent: null
};

export default BinViewer;