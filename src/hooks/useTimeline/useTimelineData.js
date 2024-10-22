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
    let currentPosition = 0;
    const rows = clips.map((clip, index) => {
      // For new clips, place them sequentially
      const isNewClip = !clip.hasBeenPositioned;
      const start = isNewClip ? currentPosition : clip.startTime;
      const duration = clip.endTime - clip.startTime;

      if (isNewClip) {
        currentPosition += duration + 0.1; // Add small gap for new clips
      }

      return {
        id: String(index), // Each clip gets its own row
        actions: [{
          id: clip.id,
          start: start,
          end: start + duration,
          effectId: 'default',
          flexible: true,
          movable: true,
          data: {
            ...clip,
            hasBeenPositioned: true,
            originalStart: clip.startTime,
            originalEnd: clip.endTime
          }
        }]
      };
    });

    // Add an empty row at the end
    rows.push({
      id: String(clips.length),
      actions: []
    });

    return rows;
  }, [clips]);

  const handleChange = useCallback((newEditorData) => {
    try {
      const updatedClips = newEditorData.flatMap((row, index) => 
        row.actions.map(action => ({
          ...action.data,
          id: action.id,
          startTime: action.start,
          endTime: action.end,
          rowIndex: index,
          hasBeenPositioned: true
        }))
      );

      onClipsChange(updatedClips);
      setError(null);
    } catch (err) {
      setError('Error updating timeline: ' + err.message);
    }
  }, [onClipsChange]);

  return { editorData, effects, error, handleChange };
};