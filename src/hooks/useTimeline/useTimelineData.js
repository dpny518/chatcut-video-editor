//src/hooks/useTimeline/useTimelineData.js
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
      let currentPosition = 0;
      const clipsState = [];
      
      const rows = clips.map((clip, index) => {
        console.log('Clip object:', {
          clip,
          currentInOut: {
            start: clip.startTime,
            end: clip.endTime
          },
          source: clip.source,  // This should show the whole source object
          duration: clip.duration,  // Duration of trimmed clip
          fullVideo: {
            duration: clip.source?.duration,  // Full video duration
            start: clip.source?.startTime,    // Always 0
            end: clip.source?.endTime         // Full video duration
          }
        });
        // Calculate clip timings
        let timelineStart, timelineEnd, playbackStart, playbackEnd;
        
        // Calculate initial positions for new clips
          if (clip.metadata?.timeline && clip.metadata?.playback) {
            // Use existing metadata if available
            timelineStart = clip.metadata.timeline.start;
            timelineEnd = clip.metadata.timeline.end;
            playbackStart = clip.metadata.playback.start;
            playbackEnd = clip.metadata.playback.end;
          } else {
            // Calculate initial positions for new clips
            timelineStart = currentPosition;
            timelineEnd = timelineStart + clip.duration;  // Use clip duration instead of source
            playbackStart = clip.startTime;  // Use clip start time
            playbackEnd = clip.endTime;      // Use clip end time
            
            if (!clip.hasBeenPositioned) {
              currentPosition = timelineEnd + 0.1;
            }
          }

        // Store clip state information
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

        return {
          id: String(index),
          actions: [{
            id: clip.id,
            start: timelineStart,
            end: timelineEnd,
            effectId: 'default',
            flexible: true,
            movable: true,
            // Add min/max bounds based on source video
            minStart: clip.source.startTime,
            maxEnd: clip.source.endTime,
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
          }]
        };
      });

      // Add empty row at the end
      rows.push({
        id: String(clips.length),
        actions: []
      });

      // Create timeline state object
      const timelineState = {
        totalDuration: formatTime(currentPosition),
        clips: clipsState,
        settings: {
          effects: Object.keys(effects),
          snapToGrid: true,
          autoScroll: true
        }
      };

      return {
        editorData: rows,
        timelineState
      };
    } catch (err) {
      console.error('Error processing timeline data:', err);
      setError('Error processing timeline data: ' + err.message);
      return {
        editorData: [{
          id: '0',
          actions: []
        }],
        timelineState: {
          totalDuration: '0:00.00',
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

  return { 
    editorData, 
    effects, 
    error,
    timelineState
  };
};