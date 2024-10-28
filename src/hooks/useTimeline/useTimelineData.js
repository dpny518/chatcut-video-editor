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
      const actionsByRow = new Map();
      
      clips.forEach((clip, index) => {
        // Calculate clip timings
        let timelineStart, timelineEnd, playbackStart, playbackEnd;
        const rowIndex = clip.metadata?.timeline?.row ?? 0;
        
        if (clip.metadata?.timeline && clip.metadata?.playback) {
          timelineStart = clip.metadata.timeline.start;
          timelineEnd = clip.metadata.timeline.end;
          playbackStart = clip.metadata.playback.start;
          playbackEnd = clip.metadata.playback.end;
        } else {
          timelineStart = currentPosition;
          timelineEnd = timelineStart + clip.duration;
          playbackStart = clip.startTime;
          playbackEnd = clip.endTime;
          
          if (!clip.hasBeenPositioned) {
            currentPosition = timelineEnd + 0.1;
          }
        }

        const action = {
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
                duration: timelineEnd - timelineStart,
                row: rowIndex
              },
              playback: {
                start: playbackStart,
                end: playbackEnd,
                duration: playbackEnd - playbackStart
              }
            }
          }
        };

        // Group actions by row
        if (!actionsByRow.has(rowIndex)) {
          actionsByRow.set(rowIndex, []);
        }
        actionsByRow.get(rowIndex).push(action);

        clipsState.push({
          id: clip.id,
          name: clip.name || `Clip ${index + 1}`,
          timelinePosition: formatTime(timelineStart),
          row: rowIndex
        });
      });

      // Convert Map to array of row objects
      const rows = Array.from(actionsByRow.entries())
        .sort(([a], [b]) => a - b) // Sort by row index
        .map(([rowIndex, actions]) => ({
          id: `row-${rowIndex}`,
          actions
        }));

      // Always ensure at least one row exists
      if (rows.length === 0) {
        rows.push({
          id: 'row-0',
          actions: []
        });
      }

      // Add empty row at the end for new clips
      rows.push({
        id: `row-${rows.length}`,
        actions: []
      });

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
        editorData: rows, // Return array of rows directly
        timelineState
      };
    } catch (err) {
      console.error('Error processing timeline data:', err);
      setError('Error processing timeline data: ' + err.message);
      return {
        editorData: [{
          id: 'row-0',
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
    editorData, // Now returns array directly
    effects, 
    error,
    timelineState
  };
};