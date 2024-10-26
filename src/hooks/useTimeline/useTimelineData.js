import { useMemo, useState } from 'react';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const useTimelineData = (clips = [], onClipsChange) => {
  const [error, setError] = useState(null);

  const effects = useMemo(() => ({
    default: {
      id: 'default',
      name: 'Default',
      style: {
        backgroundColor: '#2d3748',
        color: 'white',
        borderRadius: '4px',
        padding: '4px 8px'
      }
    },
    selected: {
      id: 'selected',
      name: 'Selected',
      style: {
        backgroundColor: '#3b82f6',
        color: 'white',
        borderRadius: '4px',
        padding: '4px 8px',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
      }
    }
  }), []);

  const { editorData, timelineState } = useMemo(() => {
    try {
      // Initialize with default values for empty timeline
      if (!Array.isArray(clips) || clips.length === 0) {
        return {
          editorData: {
            actions: [],
            rows: [{ id: '0' }],
            duration: 300, // 5 minutes default
            startAt: 0,
            endAt: 300
          },
          timelineState: {
            totalDuration: formatTime(300),
            clips: [],
            settings: {
              effects: Object.keys(effects),
              snapToGrid: true,
              autoScroll: true
            }
          }
        };
      }

      let currentPosition = 0;
      const clipsState = [];
      const actions = [];
      
      // Process clips
      clips.forEach((clip, index) => {
        // Calculate clip timings
        let timelineStart, timelineEnd, playbackStart, playbackEnd;
        
        if (clip.metadata?.timeline && clip.metadata?.playback) {
          // Use existing metadata if available
          timelineStart = clip.metadata.timeline.start;
          timelineEnd = clip.metadata.timeline.end;
          playbackStart = clip.metadata.playback.start;
          playbackEnd = clip.metadata.playback.end;
        } else {
          // Calculate initial positions for new clips
          timelineStart = currentPosition;
          timelineEnd = timelineStart + clip.duration;
          playbackStart = clip.startTime;
          playbackEnd = clip.endTime;
          
          if (!clip.hasBeenPositioned) {
            currentPosition = timelineEnd + 0.1;
          }
        }

        // Define min and max bounds
        const minStart = clip.source?.startTime ?? 0;
        const maxEnd = clip.source?.endTime ?? clip.duration ?? timelineEnd;

        // Store clip state
        clipsState.push({
          id: clip.id,
          name: clip.name || `Clip ${index + 1}`,
          timelinePosition: formatTime(timelineStart),
          currentInOut: {
            in: formatTime(playbackStart),
            out: formatTime(playbackEnd)
          },
          originalInOut: {
            in: formatTime(clip.source?.startTime ?? 0),
            out: formatTime(clip.source?.endTime ?? clip.duration ?? 0)
          },
          duration: {
            current: formatTime(playbackEnd - playbackStart),
            original: formatTime(clip.duration || 0)
          }
        });

        // Create action for the clip
        actions.push({
          id: clip.id,
          start: timelineStart,
          end: timelineEnd,
          row: 0, // All clips start in first row
          effectId: 'default',
          flexible: true,
          movable: true,
          minStart: minStart,
          maxEnd: maxEnd,
          data: {
            ...clip,
            hasBeenPositioned: true,
            metadata: {
              timeline: {
                start: timelineStart,
                end: timelineEnd,
                duration: timelineEnd - timelineStart
              },
              playback: {
                start: playbackStart,
                end: playbackEnd,
                duration: playbackEnd - playbackStart
              }
            }
          }
        });
      });

      // Calculate total duration - use max of current position or 5 minutes
      const totalDuration = Math.max(currentPosition, 300);

      return {
        editorData: {
          actions, // Array of actions at top level
          rows: [{ id: '0' }], // Single row to start
          duration: totalDuration,
          startAt: 0,
          endAt: totalDuration
        },
        timelineState: {
          totalDuration: formatTime(totalDuration),
          clips: clipsState,
          settings: {
            effects: Object.keys(effects),
            snapToGrid: true,
            autoScroll: true
          }
        }
      };

    } catch (err) {
      console.error('Error processing timeline data:', err);
      setError('Error processing timeline data: ' + err.message);
      
      // Return safe default state
      return {
        editorData: {
          actions: [],
          rows: [{ id: '0' }],
          duration: 300,
          startAt: 0,
          endAt: 300
        },
        timelineState: {
          totalDuration: formatTime(300),
          clips: [],
          settings: {
            effects: Object.keys(effects),
            snapToGrid: true,
            autoScroll: true
          }
        }
      };
    }
  }, [clips, effects]);

  // Log the processed data
  console.log('Timeline Data:', {
    clips,
    editorData,
    timelineState
  });

  return { 
    editorData, 
    effects, 
    error,
    timelineState
  };
};