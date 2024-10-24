import { useMemo, useState } from 'react';
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

  const editorData = useMemo(() => {
    try {
      let currentPosition = 0;
      const rows = clips.map((clip, index) => {
        // If clip has existing metadata from resize, use it directly
        if (clip.metadata?.timeline && clip.metadata?.playback) {
          return {
            id: String(index),
            actions: [{
              id: clip.id,
              start: clip.metadata.timeline.start,
              end: clip.metadata.timeline.end,
              effectId: 'default',
              flexible: true,
              movable: true,
              data: clip  // Use existing clip data without recalculating
            }]
          };
        }

        // Otherwise calculate initial positions for new clips
        const sourceStart = clip.source?.startTime ?? 0;
        const sourceEnd = clip.source?.endTime ?? (sourceStart + (clip.duration || 0));
        const sourceDuration = sourceEnd - sourceStart;

        const timelineStart = currentPosition;
        const timelineEnd = timelineStart + sourceDuration;
        
        // Update position for next clip
        if (!clip.hasBeenPositioned) {
          currentPosition = timelineEnd + 0.1;
        }

        return {
          id: String(index),
          actions: [{
            id: clip.id,
            start: timelineStart,
            end: timelineEnd,
            effectId: 'default',
            flexible: true,
            movable: true,
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
                  start: sourceStart,
                  end: sourceEnd,
                  duration: sourceDuration
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

      return rows;
    } catch (err) {
      console.error('Error processing timeline data:', err);
      setError('Error processing timeline data: ' + err.message);
      return [{
        id: '0',
        actions: []
      }];
    }
  }, [clips]);

  return { 
    editorData, 
    effects, 
    error
  };
};