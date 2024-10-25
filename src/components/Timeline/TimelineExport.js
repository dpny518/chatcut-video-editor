import { useCallback } from 'react';

const useTimelineExport = (timelineState) => {
  const exportTimelineData = useCallback(() => {
    try {
      console.log("Exporting timeline data");
      
      const stateToExport = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        timeline: {
          clips: timelineState.clips.map(clip => {
            // Get the stored metadata that was updated by TimelineClip
            const metadata = clip.metadata || {};
            const playback = metadata.playback || {};
            const timeline = metadata.timeline || {};

            return {
              id: clip.id,
              source: {
                startTime: playback.start,  // Use stored playback times
                endTime: playback.end,
                duration: clip.source?.duration,
                name: clip.file.name
              },
              file: {
                name: clip.file.name,
                size: clip.file.size,
                type: clip.file.type
              },
              metadata: {
                originalDuration: clip.source?.duration,
                timeline: {
                  sourceStart: clip.source?.startTime,
                  sourceEnd: clip.source?.endTime,
                  start: timeline.start,
                  end: timeline.end,
                  duration: timeline.duration
                },
                playback: {
                  start: playback.start,
                  end: playback.end,
                  duration: playback.duration
                }
              },
              position: {
                timelineStart: timeline.start,
                timelineEnd: timeline.end,
                currentStart: playback.start,
                currentEnd: playback.end,
                track: timeline.track || 0
              },
              state: {
                selected: clip.id === timelineState.selectedClipId,
                effectId: clip.effectId || 'default'
              }
            };
          }),
          duration: timelineState.duration || 0,
          settings: {
            scale: timelineState.settings?.scale || 1,
            effects: timelineState.settings?.effects || {}
          }
        }
      };

      // Debug logging
      console.log('Timeline Export Data:', {
        clipCount: stateToExport.timeline.clips.length,
        clips: stateToExport.timeline.clips.map(clip => ({
          id: clip.id,
          timeline: `${clip.position.timelineStart}-${clip.position.timelineEnd}`,
          playback: `${clip.position.currentStart}-${clip.position.currentEnd}`
        }))
      });

      const blob = new Blob([JSON.stringify(stateToExport, null, 2)], {
        type: 'application/json'
      });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `timeline_export_${timestamp}.json`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export timeline:', error);
      throw error;
    }
  }, [timelineState]);

  return { exportTimelineData };
};

const TimelineExportButton = ({ timelineState }) => {
  const { exportTimelineData } = useTimelineExport(timelineState);

  return (
    <button
      onClick={exportTimelineData}
      className="export-button"
      title="Download timeline state as JSON"
    >
      Download Timeline
    </button>
  );
};

export { useTimelineExport, TimelineExportButton };