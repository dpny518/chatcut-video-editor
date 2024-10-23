// src/components/Timeline/TimelineExport.js
import { useCallback } from 'react';

const useTimelineExport = (timelineState) => {
  const exportTimelineData = useCallback(() => {
    try {
      // Debug logs
      console.log('Full Timeline State:', timelineState);
      console.log('Clips:', timelineState.clips);
      if (timelineState.clips.length > 0) {
        console.log('First Clip Example:', timelineState.clips[0]);
      }
      console.log('Settings:', timelineState.settings);
      console.log('Duration:', timelineState.totalDuration);

      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        timeline: {
          clips: timelineState.clips.map(clip => {
            console.log('Processing clip:', clip); // Debug log for each clip
            return {
              id: clip.id,
              source: {
                startTime: clip.startTime,
                endTime: clip.endTime,
                duration: clip.duration,
                name: clip.name
              },
              file: {
                name: clip.file.name,
                size: clip.file.size,
                type: clip.file.type
              },
              metadata: {
                originalDuration: clip.duration,
                timeline: {
                  start: clip.startTime,
                  end: clip.endTime
                }
              }
            };
          }),
          duration: timelineState.totalDuration || 0,
          settings: {
            scale: timelineState.settings?.scale,
            effects: timelineState.settings?.effects
          }
        }
      };

      // Log the final export data
      console.log('Export Data Structure:', exportData);

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timeline_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export timeline:', error);
      console.error('Timeline State at error:', timelineState);
    }
  }, [timelineState]);

  return { exportTimelineData };
};

// Usage in your download button component:
const TimelineExportButton = ({ timelineState }) => {
  const { exportTimelineData } = useTimelineExport(timelineState);

  return (
    <button
      onClick={exportTimelineData}
      className="export-button"
    >
      Download Timeline
    </button>
  );
};

export { useTimelineExport, TimelineExportButton };