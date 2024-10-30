//src/hookes/useTimeline/useTimelineHanders.js
import { useCallback } from 'react';

export const useTimelineHandlers = (clips, onClipsChange, onClipSelect) => {
  const handleChange = useCallback((newEditorData) => {
    console.log('Timeline Changed:', newEditorData);
    
    if (!newEditorData?.actions) return;
  
    const updatedClips = clips.map(clip => {
      const action = newEditorData.actions.find(a => a.id === clip.id);
      if (!action) return clip;
  
      const actionData = action.data || {};
      const metadata = actionData.metadata || {};
      const timeline = metadata.timeline || {};
      const playback = metadata.playback || {};
  
      const hasTimelineMetadata = Object.keys(timeline).length > 0;
      const timelineStart = hasTimelineMetadata ? timeline.start : action.start;
      const timelineEnd = hasTimelineMetadata ? timeline.end : action.end;
      const timelineDuration = timelineEnd - timelineStart;
  
      const hasPlaybackMetadata = Object.keys(playback).length > 0;
      const playbackStart = hasPlaybackMetadata ? playback.start : clip.startTime;
      const playbackEnd = hasPlaybackMetadata ? playback.end : clip.endTime;
      const playbackDuration = playbackEnd - playbackStart;
  
      return {
        ...clip,
        ...actionData,
        startTime: playbackStart,
        endTime: playbackEnd,
        metadata: {
          ...metadata,
          timeline: {
            start: timelineStart,
            end: timelineEnd,
            duration: timelineDuration,
          },
          playback: {
            start: playbackStart,
            end: playbackEnd,
            duration: playbackDuration
          }
        }
      };
    });
  
    onClipsChange(updatedClips);
  }, [clips, onClipsChange]);

  const handleMoveStart = useCallback(({ action, row }) => {
    console.log('Move Start:', { action, row });
    
    action.data = {
      ...action.data,
      originalConstraints: {
        minStart: action.minStart,
        maxEnd: action.maxEnd
      }
    };
    
    action.minStart = undefined;
    action.maxEnd = undefined;
    
    onClipSelect?.(action.id);
  }, [onClipSelect]);

  const handleMoving = useCallback(({ action, row, start, end }) => {
    console.log('Moving:', { action, start, end });
    
    action.data = {
      ...action.data,
      metadata: {
        ...action.data.metadata,
        timeline: {
          start,
          end,
          duration: end - start,
          initialStart: action.data.metadata?.timeline?.initialStart
        },
        playback: {
          start: action.data.metadata?.playback?.start || action.data.startTime,
          end: action.data.metadata?.playback?.end || action.data.endTime,
          duration: action.data.metadata?.playback?.duration || (action.data.endTime - action.data.startTime)
        }
      }
    };
    
    return true;
  }, []);

  const handleMoveEnd = useCallback(({ action, row, start, end }) => {
    console.log('Move End:', { action, start, end });

    if (action.data?.originalConstraints) {
      action.minStart = action.data.originalConstraints.minStart;
      action.maxEnd = action.data.originalConstraints.maxEnd;
    }

    const updatedClips = clips.map(clip => {
      if (clip.id === action.id) {
        return {
          ...clip,
          metadata: {
            ...clip.metadata,
            timeline: {
              start,
              end,
              duration: end - start,
              row: clip.metadata?.timeline?.row || 0
            }
          }
        };
      }
      return clip;
    });

    onClipsChange(updatedClips);
  }, [clips, onClipsChange]);

  return {
    handleChange,
    handleMoveStart,
    handleMoving,
    handleMoveEnd
  };
};
