// hooks/useTimeline/useTimelineData.js
import { useCallback, useMemo, useState } from 'react';

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
        // Safely access clip properties with defaults
        const sourceStart = clip.source?.startTime ?? 0;
        const sourceEnd = clip.source?.endTime ?? (sourceStart + (clip.duration || 0));
        const sourceDuration = sourceEnd - sourceStart;

        const timelineStart = clip.metadata?.timeline?.start ?? currentPosition;
        const timelineEnd = clip.metadata?.timeline?.end ?? (timelineStart + sourceDuration);
        
        // For new clips, place them sequentially
        if (!clip.hasBeenPositioned) {
          currentPosition = timelineEnd + 0.1; // Add small gap
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
              source: {
                startTime: sourceStart,
                endTime: sourceEnd,
                duration: sourceDuration,
                name: clip.source?.name || 'Untitled'
              },
              metadata: {
                originalDuration: sourceDuration,
                timeline: {
                  start: timelineStart,
                  end: timelineEnd
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

  const handleChange = useCallback((newEditorData) => {
    try {
      const updatedClips = newEditorData.flatMap((row, index) => 
        row.actions.map(action => {
          const originalClip = clips.find(c => c.id === action.id);
          if (!originalClip) return null;

          return {
            ...action.data,
            id: action.id,
            source: {
              ...originalClip.source,
              startTime: originalClip.source?.startTime ?? 0,
              endTime: originalClip.source?.endTime ?? action.end - action.start,
              duration: originalClip.source?.duration ?? action.end - action.start
            },
            metadata: {
              ...originalClip.metadata,
              timeline: {
                start: action.start,
                end: action.end
              }
            },
            rowIndex: index,
            hasBeenPositioned: true
          };
        })
      ).filter(Boolean); // Remove any null entries

      onClipsChange(updatedClips);
      setError(null);
    } catch (err) {
      console.error('Error updating timeline:', err);
      setError('Error updating timeline: ' + err.message);
    }
  }, [clips, onClipsChange]);

  return { 
    editorData, 
    effects, 
    error, 
    handleChange 
  };
};