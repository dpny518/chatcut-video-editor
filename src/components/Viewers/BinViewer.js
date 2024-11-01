// src/components/Viewers/BinViewer.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, Slider, Button, Alert, CircularProgress } from '@mui/material';
import { formatTime } from '../../utils/formatters';

const MIN_CLIP_DURATION = 1;
const PROGRESS_INTERVAL = 100;

const BinViewer = ({ 
  clips,                    // All available clips
  selectedClips = [],           // Currently selected clips
  onAddToTimeline,             // Handler for adding to timeline
  timelineRows = [],           // Timeline row data
  setTimelineRows              // Timeline row updater
}) => {
  // State
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [range, setRange] = useState([0, 0]);

  // Refs
  const playerRefs = useRef(new Map());
  const urlRefs = useRef(new Map());
  const durationRefs = useRef(new Map());

  // Load videos when selection changes
  useEffect(() => {
    const loadClips = async () => {
      if (!selectedClips?.length) return;
      
      setLoading(true);
      setError(null);
      setPlaying(false);

      try {
        // Cleanup old URLs
        urlRefs.current.forEach(url => URL.revokeObjectURL(url));
        urlRefs.current.clear();
        playerRefs.current.clear();
        durationRefs.current.clear();

        // Load durations for all selected clips
        const durationPromises = selectedClips.map(clip => new Promise((resolve) => {
          const video = document.createElement('video');
          const url = URL.createObjectURL(clip.file);
          video.src = url;
          urlRefs.current.set(clip.id, url);
          
          video.addEventListener('loadedmetadata', () => {
            durationRefs.current.set(clip.id, video.duration);
            resolve();
          });

          video.addEventListener('error', () => {
            resolve(0); // Handle loading errors gracefully
          });
        }));

        await Promise.all(durationPromises);

        // Create segments from loaded clips
        const newSegments = selectedClips.map(clip => ({
          sourceClip: {
            ...clip,
            duration: durationRefs.current.get(clip.id) || 0
          },
          startTime: 0,
          endTime: durationRefs.current.get(clip.id) || 0,
          file: clip.file
        }));

        setSegments(newSegments);

        // Calculate total duration and set initial range
        const totalDur = newSegments.reduce((sum, segment) => 
          sum + (segment.endTime - segment.startTime), 0
        );
        setTotalDuration(totalDur);
        setRange([0, totalDur]);

        // Set initial active segment
        if (newSegments.length > 0) {
          setActiveSegment({
            sourceClip: newSegments[0].sourceClip,
            time: 0,
            segmentIndex: 0
          });
        }

      } catch (err) {
        setError(`Failed to load videos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadClips();

    return () => {
      urlRefs.current.forEach(url => URL.revokeObjectURL(url));
      urlRefs.current.clear();
    };
  }, [selectedClips]);

  const handleProgress = useCallback((state) => {
    if (!activeSegment || !segments.length) return;

    const currentSegment = segments[activeSegment.segmentIndex];
    const segmentDuration = currentSegment.endTime - currentSegment.startTime;
    const currentSegmentTime = state.playedSeconds;

    // Calculate global time position
    let globalTime = 0;
    for (let i = 0; i < activeSegment.segmentIndex; i++) {
      globalTime += segments[i].endTime - segments[i].startTime;
    }
    globalTime += currentSegmentTime;

    setCurrentTime(globalTime);

    // Handle segment transitions
    if (currentSegmentTime >= segmentDuration) {
      if (activeSegment.segmentIndex < segments.length - 1) {
        // Move to next segment
        setActiveSegment({
          sourceClip: segments[activeSegment.segmentIndex + 1].sourceClip,
          time: 0,
          segmentIndex: activeSegment.segmentIndex + 1
        });
      } else {
        // End of all segments
        setPlaying(false);
      }
    }
  }, [activeSegment, segments]);

  const handleAddToTimeline = useCallback(() => {
    if (!segments.length) return;
  
    const [startTime, endTime] = range;
    
    try {
      // Find the end position of the last clip in the timeline
      const findTimelineEndPosition = (clips) => {
        console.log('Finding last clip end from clips:', clips);
        if (!clips.length) return 0;
        const maxEnd = Math.max(...clips.map(clip => clip.metadata.timeline.end));
        console.log('Found last clip end position:', maxEnd);
        return maxEnd;
      };
  
      // Start position for the new clips
      let timelinePosition = findTimelineEndPosition(clips);
      console.log('Initial timeline position:', timelinePosition);
      
      // Add a small gap if there are existing clips
      if (timelinePosition > 0) {
        timelinePosition += 0.0; // 0ms gap between clips
        console.log('Timeline position after gap:', timelinePosition);
      }
  
      let accumulatedTime = 0;
      const clipsToAdd = [];
      
      segments.forEach((segment, index) => {
        console.log(`Processing segment ${index}:`, segment);
        
        const segmentDuration = segment.endTime - segment.startTime;
        const segmentStart = accumulatedTime;
        const segmentEnd = segmentStart + segmentDuration;
  
        // Check if this segment overlaps with the selected range
        if (startTime < segmentEnd && endTime > segmentStart) {
          // Calculate the portion of this segment to use
          const clipStartTime = Math.max(0, startTime - segmentStart);
          const clipEndTime = Math.min(segmentDuration, endTime - segmentStart);
          const clipDuration = clipEndTime - clipStartTime;
  
          // Create clip data
          const clipData = {
            id: `clip-${Date.now()}-${segment.sourceClip.id}`,
            file: segment.sourceClip.file,
            name: segment.sourceClip.name,
            type: 'video/mp4',
            size: segment.sourceClip.size,
            duration: clipDuration,
            startTime: clipStartTime + segment.startTime,
            endTime: clipEndTime + segment.startTime,
            source: {
              duration: segment.sourceClip.duration,
              startTime: 0,
              endTime: segment.sourceClip.duration
            },
            metadata: {
              timeline: {
                start: timelinePosition,
                end: timelinePosition + clipDuration,
                duration: clipDuration,
                track: 0 // Default to first track
              },
              playback: {
                start: clipStartTime + segment.startTime,
                end: clipEndTime + segment.startTime,
                duration: clipDuration
              }
            }
          };
  
          console.log('Created clip data:', clipData);
          clipsToAdd.push(clipData);
  
          // Update position for next clip
          timelinePosition += clipDuration;
          console.log('Updated timeline position for next clip:', timelinePosition);
        }
  
        accumulatedTime += segmentDuration;
      });
  
      // Add all clips to timeline
      clipsToAdd.forEach(clipData => {
        console.log('Adding clip to timeline:', clipData);
        onAddToTimeline(clipData);
      });
  
    } catch (error) {
      console.error('Error adding to timeline:', error);
      setError('Failed to add clip to timeline: ' + error.message);
    }
  }, [segments, range, clips, onAddToTimeline]);

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
      ) : (
        <>
          <Box sx={{ 
            flex: 1, 
            position: 'relative', 
            bgcolor: 'black',
            aspectRatio: '16/9',
            overflow: 'hidden'
          }}>
            {segments.map((segment, index) => (
              <ReactPlayer
                key={segment.sourceClip.id}
                ref={ref => playerRefs.current.set(segment.sourceClip.id, ref)}
                url={urlRefs.current.get(segment.sourceClip.id)}
                width="100%"
                height="100%"
                style={{ 
                  display: activeSegment?.segmentIndex === index ? 'block' : 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                playing={playing && activeSegment?.segmentIndex === index}
                onProgress={handleProgress}
                progressInterval={PROGRESS_INTERVAL}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      disablePictureInPicture: true
                    }
                  }
                }}
              />
            ))}
          </Box>

          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={() => setPlaying(!playing)}
              disabled={!segments.length}
              sx={{ mb: 2 }}
            >
              {playing ? 'Pause' : 'Play'}
            </Button>

            <Slider
              value={range}
              onChange={(_, newValue) => {
                if (newValue[1] - newValue[0] >= MIN_CLIP_DURATION) {
                  setRange(newValue);
                  setPlaying(false);
                  
                  // Update active segment based on new position
                  let timeAcc = 0;
                  for (let i = 0; i < segments.length; i++) {
                    const segmentDuration = segments[i].endTime - segments[i].startTime;
                    if (timeAcc <= newValue[0] && timeAcc + segmentDuration > newValue[0]) {
                      setActiveSegment({
                        sourceClip: segments[i].sourceClip,
                        time: newValue[0] - timeAcc,
                        segmentIndex: i
                      });
                      break;
                    }
                    timeAcc += segmentDuration;
                  }
                }
              }}
              min={0}
              max={totalDuration}
              step={0.1}
              disabled={!segments.length}
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">
                Range: {formatTime(range[0])} - {formatTime(range[1])}
              </Typography>
              <Typography variant="caption">
                Current: {formatTime(currentTime)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleAddToTimeline}
              disabled={!segments.length || range[1] - range[0] < MIN_CLIP_DURATION}
              fullWidth
              sx={{ mt: 2 }}
            >
              Add to Timeline
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BinViewer;