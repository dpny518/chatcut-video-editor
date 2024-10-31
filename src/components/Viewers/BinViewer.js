import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Button, Alert, CircularProgress, List, ListItem } from '@mui/material';
import { debounce } from 'lodash';
import { formatTime } from '../../utils/formatters';

const MIN_CLIP_DURATION = 1;
const SEEK_DEBOUNCE_MS = 100;
const PROGRESS_INTERVAL = 100;

// New structure to track multiple clips
const ClipSegmentManager = {
  // Convert time from merged timeline back to source clip time
  getSourceTime: (globalTime, segments) => {
    let accumulatedTime = 0;
    for (const segment of segments) {
      const segmentDuration = segment.endTime - segment.startTime;
      if (globalTime >= accumulatedTime && globalTime < accumulatedTime + segmentDuration) {
        return {
          clip: segment.sourceClip,
          time: segment.startTime + (globalTime - accumulatedTime)
        };
      }
      accumulatedTime += segmentDuration;
    }
    return null;
  },

  // Convert source clip time to merged timeline time
  getGlobalTime: (sourceClip, sourceTime, segments) => {
    let accumulatedTime = 0;
    for (const segment of segments) {
      if (segment.sourceClip.id === sourceClip.id) {
        if (sourceTime >= segment.startTime && sourceTime <= segment.endTime) {
          return accumulatedTime + (sourceTime - segment.startTime);
        }
      }
      accumulatedTime += segment.endTime - segment.startTime;
    }
    return null;
  },

  // Calculate total duration of merged timeline
  getTotalDuration: (segments) => {
    return segments.reduce((total, segment) => {
      return total + (segment.endTime - segment.startTime);
    }, 0);
  }
};

const BinViewer = ({ 
  selectedClips, // Now accepts array of clips
  onAddToTimeline,
  setTimelineRows
}) => {
  console.log("BinViewer received selectedClips:", selectedClips);
  // Enhanced state for multiple clips
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  
  // New state for managing merged timeline
  const [segments, setSegments] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Refs
  const playerRefs = useRef(new Map());
  const urlRefs = useRef(new Map());

  // Initialize segments when selected clips change
  useEffect(() => {
    if (!selectedClips?.length) return;

    const newSegments = selectedClips.map(clip => ({
      sourceClip: clip,
      startTime: 0,
      endTime: clip.duration || 0,
      file: clip.file
    }));

    setSegments(newSegments);
    setTotalDuration(ClipSegmentManager.getTotalDuration(newSegments));
    setRange([0, ClipSegmentManager.getTotalDuration(newSegments)]);
    setCurrentTime(0);
    setPlaying(false);
  }, [selectedClips]);

  const [durationsLoaded, setDurationsLoaded] = useState(false);
const durationRefs = useRef(new Map());

// Modify the video loading effect
useEffect(() => {
  const loadClips = async () => {
    setLoading(true);
    setError(null);
    setDurationsLoaded(false);

    try {
      // Cleanup old URLs
      urlRefs.current.forEach(url => URL.revokeObjectURL(url));
      urlRefs.current.clear();
      playerRefs.current.clear();
      durationRefs.current.clear();

      // Create video elements to get durations
      const durationPromises = selectedClips.map(clip => new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(clip.file);
        
        video.addEventListener('loadedmetadata', () => {
          durationRefs.current.set(clip.id, video.duration);
          resolve();
        });

        urlRefs.current.set(clip.id, video.src);
      }));

      await Promise.all(durationPromises);
      setDurationsLoaded(true);

      // Now create segments with proper durations
      const newSegments = selectedClips.map(clip => ({
        sourceClip: {
          ...clip,
          duration: durationRefs.current.get(clip.id)
        },
        startTime: 0,
        endTime: durationRefs.current.get(clip.id),
        file: clip.file
      }));

      setSegments(newSegments);
      const totalDur = ClipSegmentManager.getTotalDuration(newSegments);
      setTotalDuration(totalDur);
      setRange([0, totalDur]);

    } catch (err) {
      setError(`Failed to load videos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (selectedClips?.length) {
    loadClips();
  }

  return () => {
    urlRefs.current.forEach(url => URL.revokeObjectURL(url));
    urlRefs.current.clear();
  };
}, [selectedClips]);

// Add play/pause control
const handlePlayPause = () => {
  if (!segments.length) return;
  
  // If no active segment, set the first one
  if (!activeSegment && segments.length > 0) {
    setActiveSegment({
      sourceClip: segments[0].sourceClip,
      time: segments[0].startTime
    });
  }
  
  setPlaying(!playing);
};

// Set initial active segment when segments change
useEffect(() => {
  if (segments.length > 0 && !activeSegment) {
    setActiveSegment({
      sourceClip: segments[0].sourceClip,
      time: segments[0].startTime
    });
  }
}, [segments]);


  const handleAddToTimeline = () => {
    if (!selectedClips.length) return;
  
    const clipStart = range[0];
    const clipEnd = range[1];
    const timelineDuration = clipEnd - clipStart;
  
    // Calculate total duration of all source clips for merging
    const totalSourceDuration = selectedClips.reduce((total, clip) => 
      total + (clip.duration || 0), 0
    );
  
    // Create timeline positioning based on merged clips
    const timelineStart = 0; // Start at 0 since this is a new merged clip
    const timelineEnd = timelineDuration;
    
    // Create merged clip data with source tracking
    const mergedClipData = {
      id: `clip-${Date.now()}`,
      file: selectedClips[0].file, // Use first clip's file as reference
      name: selectedClips.length > 1 ? 
        `Merged Clip (${selectedClips.length} sources)` : 
        selectedClips[0].name,
      startTime: clipStart,
      endTime: clipEnd,
      duration: timelineDuration,
      source: {
        clips: selectedClips.map((clip, index) => {
          const previousDurations = selectedClips
            .slice(0, index)
            .reduce((total, c) => total + c.duration, 0);
          
          return {
            id: clip.id,
            file: clip.file,
            startTime: previousDurations, // Each clip starts after previous ones
            endTime: previousDurations + clip.duration,
            duration: clip.duration,
            originalStart: 0, // Keep track of original timing
            originalEnd: clip.duration
          };
        })
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
          duration: timelineDuration,
          sourceClips: selectedClips.map((clip, index) => {
            const previousDurations = selectedClips
              .slice(0, index)
              .reduce((total, c) => total + c.duration, 0);
              
            return {
              id: clip.id,
              globalStart: previousDurations, // Position in merged timeline
              globalEnd: previousDurations + clip.duration,
              inPoint: 0, // Original clip timing
              outPoint: clip.duration,
              originalDuration: clip.duration
            };
          })
        }
      }
    };
  
    onAddToTimeline?.(mergedClipData);
    
    console.log('Adding merged clip with metadata:', {
      clip: mergedClipData,
      timeline: mergedClipData.metadata.timeline,
      playback: mergedClipData.metadata.playback,
      sources: mergedClipData.source.clips
    });
  };

  // ... rest of your existing BinViewer UI code, modified to handle segments ...

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : !durationsLoaded ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Loading video durations...</Typography>
        </Box>
      ) : (
        <>
          {/* Viewer section */}
          <Box sx={{ 
  flex: 1, 
  position: 'relative', 
  bgcolor: 'black',
  aspectRatio: '16/9',
  width: '100%',
  overflow: 'hidden'
}}>
  {/* Placeholder when no video is showing */}
  {(!activeSegment || !segments.length) && (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      textAlign: 'center'
    }}>
      <Typography>
        {segments.length ? 'Click play to start' : 'No video selected'}
      </Typography>
    </Box>
  )}
  
  {segments.map((segment, index) => (
  <div key={segment.sourceClip.id} className="relative w-full h-full">
    <ReactPlayer
      ref={ref => {
        if (ref) {
          playerRefs.current.set(segment.sourceClip.id, ref);
        }
      }}
      url={urlRefs.current.get(segment.sourceClip.id)}
      width="100%"
      height="100%"
      style={{ 
        display: activeSegment?.sourceClip.id === segment.sourceClip.id ? 'block' : 'none',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      playing={playing && activeSegment?.sourceClip.id === segment.sourceClip.id}
      playbackRate={1}
      controls={false} // Remove default controls
      config={{
        file: {
          attributes: {
            controlsList: 'nodownload',
            style: { width: '100%', height: '100%' },
            disablePictureInPicture: true // Disable PiP button
          }
        }
      }}
      onProgress={state => {
        if (activeSegment?.sourceClip.id === segment.sourceClip.id) {
          const globalTime = ClipSegmentManager.getGlobalTime(
            segment.sourceClip,
            state.playedSeconds,
            segments
          );
          if (globalTime !== null) {
            setCurrentTime(globalTime);
          }
        }
      }}
    />
    
    {/* Custom play button overlay */}
    {activeSegment?.sourceClip.id === segment.sourceClip.id && !playing && (
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30"
        onClick={() => setPlaying(true)}
      >
        <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
          <div 
            className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-16 border-l-black ml-1"
          />
        </div>
      </div>
    )}
  </div>
))}
</Box>

          {/* Playback controls */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              onClick={handlePlayPause}
              variant="contained"
              size="small"
              sx={{ mb: 2 }}
            >
              {playing ? 'Pause' : 'Play'}
            </Button>
          </Box>

          {/* Timeline section */}
          <Box sx={{ p: 2 }}>
            <Slider
              value={range}
              onChange={(event, newValue) => {
                if (newValue[1] - newValue[0] >= MIN_CLIP_DURATION) {
                  setRange(newValue);
                  // Update active segment based on current time
                  const sourceInfo = ClipSegmentManager.getSourceTime(newValue[0], segments);
                  if (sourceInfo) {
                    setActiveSegment({
                      sourceClip: sourceInfo.clip,
                      time: sourceInfo.time
                    });
                  }
                }
              }}
              min={0}
              max={totalDuration}
              step={0.1}
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">
                Selected Range: {formatTime(range[0])} - {formatTime(range[1])}
              </Typography>
              <Typography variant="caption">
                Current Time: {formatTime(currentTime)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleAddToTimeline}
              disabled={!segments.length || range[1] - range[0] < MIN_CLIP_DURATION}
              fullWidth
              sx={{ mt: 2 }}
            >
              Add Selection to Timeline
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};


export default BinViewer;