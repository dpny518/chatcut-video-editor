import { useMemo, useCallback, useState, useEffect } from 'react';

export const useTimelineTransition = (clips = [], currentTime, playing) => {
  const [playbackStates, setPlaybackStates] = useState({});

  // Track active clips based on timeline position
  const activeClips = useMemo(() => {
    return clips.filter(clip => {
      if (!clip.metadata || !clip.metadata.timeline) {
        console.warn('Clip is missing metadata or timeline:', clip);
        return false; // Skip this clip
      }
      const { start, end } = clip.metadata.timeline;
      return currentTime >= start && currentTime <= end;
    }).sort((a, b) => a.metadata.timeline.start - b.metadata.timeline.start);
  }, [clips, currentTime]);

  // Calculate opacity for each clip based on overlap position
  const getClipOpacity = useCallback((clip) => {
    const { start, end } = clip.metadata.timeline;
    const progress = (currentTime - start) / (end - start);
    
    // Fade in at start
    if (progress < 0.1) {
      return progress * 10;
    }
    // Fade out at end
    if (progress > 0.9) {
      return (1 - (progress - 0.9) * 10);
    }
    return 1;
  }, [currentTime]);

  // Calculate playback position for each clip
  const getClipPlaybackPosition = useCallback((clip) => {
    const { start } = clip.metadata.timeline;
    return currentTime - start;
  }, [currentTime]);

  // Track playback state for each clip
  useEffect(() => {
    const newPlaybackStates = {};
    activeClips.forEach(clip => {
      newPlaybackStates[clip.id] = {
        position: getClipPlaybackPosition(clip),
        opacity: getClipOpacity(clip),
        playing: playing && currentTime >= clip.metadata.timeline.start
      };
    });
    setPlaybackStates(newPlaybackStates);
  }, [activeClips, currentTime, playing, getClipPlaybackPosition, getClipOpacity]);

  return {
    activeClips,
    playbackStates,
    getClipOpacity,
    getClipPlaybackPosition
  };
};
