import { useState, useEffect, useCallback } from 'react';
import { createTimelineData, createEffects } from '../../utils/timelineUtils';

export const useTimelineData = (clips, onClipsChange) => {
  const [editorData, setEditorData] = useState([]);
  const [effects, setEffects] = useState({});
  const [error, setError] = useState(null);

  // Initialize timeline data
  useEffect(() => {
    try {
      if (!clips.length) {
        setEditorData([]);
        setEffects({});
        return;
      }

      const timelineData = createTimelineData(clips);
      const effectsData = createEffects(clips);
      
      setEditorData(timelineData);
      setEffects(effectsData);
      setError(null);
    } catch (err) {
      console.error('Error creating timeline:', err);
      setError('Failed to create timeline');
    }
  }, [clips]);
  const handleChange = useCallback((newEditorData) => {
    if (!newEditorData.length || !newEditorData[0].actions) return;

    try {
      const newClips = newEditorData[0].actions.map(action => {
        const originalClip = clips.find(clip => clip.id === action.id);
        if (!originalClip) return null;

        return {
          ...originalClip,
          startTime: action.start,
          endTime: action.end,
          duration: action.end - action.start,
        };
      }).filter(Boolean);

      if (newClips.length > 0) {
        const sortedClips = [...newClips].sort((a, b) => a.startTime - b.startTime);
        onClipsChange?.(sortedClips);
      }
    } catch (err) {
      console.error('Error updating clips:', err);
      setError('Failed to update timeline');
    }
  }, [clips, onClipsChange]);

  return { editorData, effects, error, handleChange };
};