// hooks/useTimeline/useTimelineData.js
import { useCallback, useMemo, useState } from 'react';

export const useTimelineData = (clips = [], onClipsChange) => {
  const [error, setError] = useState(null);

  // Define effects for different states
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

  // Convert clips to timeline format
  const editorData = useMemo(() => {
    const rows = [];
    const rowMap = new Map();
    let currentPosition = 0;

    clips.forEach((clip, index) => {
      const rowIndex = clip.rowIndex ?? index;
      
      if (!rowMap.has(rowIndex)) {
        rowMap.set(rowIndex, {
          id: `row-${rowIndex}`,
          actions: []
        });
        rows[rowIndex] = rowMap.get(rowIndex);
      }

      // Calculate clip duration
      const duration = clip.endTime - clip.startTime;

      rowMap.get(rowIndex).actions.push({
        id: clip.id,
        start: currentPosition,
        end: currentPosition + duration,
        effectId: 'default',
        flexible: true,
        movable: true,
        data: {
          ...clip,
          originalStart: clip.startTime, // Store original timing
          originalEnd: clip.endTime
        }
      });

      // Move position for next clip
      currentPosition += duration + 0.1; // Add small gap between clips
    });

    // Fill gaps and add empty row
    const maxRow = Math.max(...Array.from(rowMap.keys()), 0);
    for (let i = 0; i <= maxRow + 1; i++) {
      if (!rows[i]) {
        rows[i] = {
          id: `row-${i}`,
          actions: []
        };
      }
    }

    return rows;
  }, [clips]);

  // Handle timeline changes
  const handleChange = useCallback((newEditorData) => {
    try {
      const updatedClips = [];
      
      newEditorData.forEach((row, rowIndex) => {
        row.actions.forEach(action => {
          // Calculate the duration of the clip in its new position
          const newDuration = action.end - action.start;
          // Use the original timing info to maintain proper timing relationships
          const originalDuration = action.data.originalEnd - action.data.originalStart;
          // Scale the original timing to match the new duration
          const scaleFactor = newDuration / originalDuration;

          updatedClips.push({
            ...action.data,
            id: action.id,
            startTime: action.data.originalStart * scaleFactor,
            endTime: action.data.originalEnd * scaleFactor,
            rowIndex
          });
        });
      });

      onClipsChange(updatedClips);
      setError(null);
    } catch (err) {
      setError('Error updating timeline: ' + err.message);
    }
  }, [onClipsChange]);

  return { editorData, effects, error, handleChange };
};