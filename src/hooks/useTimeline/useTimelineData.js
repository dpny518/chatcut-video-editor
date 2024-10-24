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
        // Get source timing
        const sourceStart = clip.source?.startTime ?? 0;
        const sourceEnd = clip.source?.endTime ?? (sourceStart + (clip.duration || 0));
        const sourceDuration = sourceEnd - sourceStart;

        // Get or calculate timeline timing
        const timelineStart = clip.metadata?.timeline?.start ?? currentPosition;
        const timelineEnd = clip.metadata?.timeline?.end ?? (timelineStart + sourceDuration);
        const timelineDuration = timelineEnd - timelineStart;
        
        // Calculate playback timing
        const playbackStart = clip.metadata?.playback?.start ?? sourceStart;
        const playbackEnd = clip.metadata?.playback?.end ?? sourceEnd;
        const playbackDuration = playbackEnd - playbackStart;
        
        // For new clips, place them sequentially
        if (!clip.hasBeenPositioned) {
          currentPosition = timelineEnd + 0.1; // Add small gap
        }

        // Calculate relative timing
        const relativeStart = playbackStart - sourceStart;
        const relativeDuration = playbackEnd - playbackStart;

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
                  end: timelineEnd,
                  duration: timelineDuration
                },
                playback: {
                  start: playbackStart,
                  end: playbackEnd,
                  duration: playbackDuration
                },
                relative: {
                  start: relativeStart,
                  duration: relativeDuration
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
  
          // Get source timing
          const sourceStart = originalClip.source?.startTime ?? 0;
          const sourceEnd = originalClip.source?.endTime ?? sourceStart + (action.end - action.start);
          const sourceDuration = sourceEnd - sourceStart;
  
          // Calculate timeline timing
          const timelineStart = action.start;
          const timelineEnd = action.end;
          const timelineDuration = timelineEnd - timelineStart;
  
          // Check if this is a new clip (no metadata yet)
          const isNewClip = !originalClip.metadata?.playback;
  
          let playbackStart, playbackEnd, playbackDuration;
  
          if (isNewClip) {
            // For new clips, use source timing
            console.log('Initializing new clip with source timing');
            playbackStart = sourceStart;
            playbackEnd = sourceEnd;
            playbackDuration = sourceDuration;
          } else {
            // For existing clips, calculate based on changes
            console.log('Updating existing clip timing');
            const timelineOffset = timelineStart - (originalClip.metadata.timeline.start);
            const timelineRatio = timelineDuration / originalClip.metadata.timeline.duration;
            
            const originalPlaybackStart = originalClip.metadata.playback.start;
            const originalPlaybackDuration = originalClip.metadata.playback.duration;
  
            playbackStart = originalPlaybackStart + (timelineOffset * (originalPlaybackDuration / sourceDuration));
            playbackDuration = originalPlaybackDuration * timelineRatio;
            playbackEnd = playbackStart + playbackDuration;
          }
  
          // Calculate relative timing
          const relativeStart = playbackStart - sourceStart;
          const relativeDuration = playbackEnd - playbackStart;
  
          console.log('Clip Update:', {
            id: action.id,
            isNewClip,
            source: { start: sourceStart, end: sourceEnd },
            timeline: { start: timelineStart, end: timelineEnd },
            playback: { start: playbackStart, end: playbackEnd }
          });
  
          return {
            ...action.data,
            id: action.id,
            source: {
              ...originalClip.source,
              startTime: sourceStart,
              endTime: sourceEnd,
              duration: sourceDuration
            },
            metadata: {
              ...originalClip.metadata,
              originalDuration: sourceDuration,
              timeline: {
                start: timelineStart,
                end: timelineEnd,
                duration: timelineDuration
              },
              playback: {
                start: playbackStart,
                end: playbackEnd,
                duration: playbackDuration
              },
              relative: {
                start: relativeStart,
                duration: relativeDuration
              }
            },
            rowIndex: index,
            hasBeenPositioned: true
          };
        })
      ).filter(Boolean);
  
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