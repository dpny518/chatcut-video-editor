// src/components/hooks/useTimeline/useTimelineResize.js
import { useCallback } from 'react';

export const useTimelineResize = (clips, onClipsChange, onClipSelect) => {
  const handleResizeStart = useCallback(({ action, row, dir }) => {
    console.log('Resize Start:', { action, dir });
    
    action.data = {
      ...action.data,
      resizeDir: dir
    };
    
    onClipSelect?.(action.id);
  }, [onClipSelect]);

  const handleResizing = useCallback(({ action, row, start, end, dir }) => {
    console.log('Resizing:', { action, start, end, dir });

    const sourceStart = action.data.source.startTime || 0;
    const sourceEnd = action.data.source.endTime;
    const timelineDuration = end - start;

    let playbackStart = action.data.metadata?.playback?.start || action.data.startTime;
    let playbackEnd = action.data.metadata?.playback?.end || action.data.endTime;

    if (dir === 'left') {
      playbackEnd = action.data.metadata?.playback?.end || action.data.endTime;
      playbackStart = playbackEnd - timelineDuration;
    } else if (dir === 'right') {
      playbackStart = action.data.metadata?.playback?.start || action.data.startTime;
      playbackEnd = playbackStart + timelineDuration;
    }

    playbackStart = Math.max(playbackStart, sourceStart);
    playbackEnd = Math.min(playbackEnd, sourceEnd);
    
    action.data = {
      ...action.data,
      startTime: playbackStart,
      endTime: playbackEnd,
      duration: playbackEnd - playbackStart,
      metadata: {
        ...action.data.metadata,
        timeline: {
          start,
          end,
          duration: timelineDuration,
          row: action.data.metadata?.timeline?.row || 0
        },
        playback: {
          start: playbackStart,
          end: playbackEnd,
          duration: playbackEnd - playbackStart
        }
      }
    };

    return true;
  }, []);

  const handleResizeEnd = useCallback(({ action, row, start, end, dir }) => {
    console.log('Resize End:', { action, start, end, dir });

    const updatedClips = clips.map(clip => {
      if (clip.id === action.id) {
        return {
          ...clip,
          startTime: action.data.startTime,
          endTime: action.data.endTime,
          duration: action.data.endTime - action.data.startTime,
          metadata: {
            ...action.data.metadata,
            timeline: {
              ...action.data.metadata.timeline,
              start,
              end,
              duration: end - start
            },
            playback: {
              ...action.data.metadata.playback
            }
          }
        };
      }
      return clip;
    });

    onClipsChange(updatedClips);
  }, [clips, onClipsChange]);

  return {
    handleResizeStart,
    handleResizing,
    handleResizeEnd
  };
};