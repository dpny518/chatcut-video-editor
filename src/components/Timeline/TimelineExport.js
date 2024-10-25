import { useCallback } from 'react';
import { formatTime } from '../../utils/formatters';
const useTimelineExport = (timelineState) => {
  const exportTimelineData = useCallback(() => {
    try {
      console.log('=== TIMELINE EXPORT START ===');
      console.log('Timeline State:', {
        clips: timelineState.clips,
        editorData: timelineState.editorData,
        settings: timelineState.settings,
        duration: timelineState.totalDuration
      });

      const exportData = {
        version: "1.1",
        timestamp: new Date().toISOString(),
        timeline: {
          clips: timelineState.clips.map(clip => {
            // Find corresponding editor action to get current timeline position
            const editorAction = timelineState.editorData?.actions?.find(
              action => action.id === clip.id
            );

            console.log('Processing Clip:', {
              clipId: clip.id,
              clipData: clip,
              editorAction: editorAction,
              currentPosition: {
                start: editorAction?.start,
                end: editorAction?.end
              }
            });

            return {
              id: clip.id,
              name: clip.name,
              source: {
                startTime: clip.startTime,
                endTime: clip.endTime,
                duration: clip.duration,
                name: clip.name
              },
              file: {
                name: clip.file?.name,
                size: clip.file?.size,
                type: clip.file?.type
              },
              metadata: {
                originalDuration: clip.duration,
                timeline: {
                  // Original media timing
                  sourceStart: clip.startTime,
                  sourceEnd: clip.endTime,
                  // Current timeline positions
                  start: editorAction?.start ?? 0,
                  end: editorAction?.end ?? clip.duration,
                  position: clip.timelinePosition,
                  // Detailed timing information
                  timing: {
                    timelinePosition: formatTime(editorAction?.start ?? 0),
                    originalStart: formatTime(clip.startTime),
                    originalEnd: formatTime(clip.endTime), 
                    currentStart: formatTime(clip.startTime),
                    currentEnd: formatTime(clip.endTime),
                    duration: formatTime(clip.endTime - clip.startTime),
                    originalDuration: formatTime(clip.endTime - clip.startTime)
                  }
                },
                playback: {
                  current: clip.currentInOut,
                  original: clip.originalInOut
                },
                duration: {
                  current: clip.duration.current,
                  original: clip.duration.original
                }
              },
              position: {
                timelineStart: editorAction?.start ?? 0,
                timelineEnd: editorAction?.end ?? clip.duration,
                row: editorAction?.data?.rowIndex ?? 0
              },
              state: {
                selected: clip.id === timelineState.selectedClipId,
                effectId: editorAction?.effectId ?? 'default'
              }
            };
          }),
          duration: timelineState.totalDuration || 0,
          settings: {
            scale: timelineState.settings?.scale,
            effects: timelineState.settings?.effects,
            snapToGrid: timelineState.settings?.snapToGrid,
            autoScroll: timelineState.settings?.autoScroll
          }
        }
      };

      // Log the final export data with timing comparison
      console.log('=== EXPORT DATA ANALYSIS ===');
      exportData.timeline.clips.forEach(clip => {
        console.log(`Clip ${clip.id} Timing Analysis:`, {
          sourceTimings: {
            start: clip.source.startTime,
            end: clip.source.endTime,
            duration: clip.source.duration
          },
          timelinePositions: {
            start: clip.position.timelineStart,
            end: clip.position.timelineEnd,
            duration: clip.position.timelineEnd - clip.position.timelineStart
          },
          playback: clip.metadata.playback,
          duration: clip.metadata.duration,
          metadata: clip.metadata
        });
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `timeline_export_${timestamp}.json`;
      
      console.log('Saving export file:', filename);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('=== TIMELINE EXPORT COMPLETE ===');
    } catch (error) {
      console.error('=== TIMELINE EXPORT ERROR ===');
      console.error('Error details:', error);
      console.error('Timeline State at error:', {
        clips: timelineState.clips,
        editorData: timelineState.editorData,
        settings: timelineState.settings
      });
      throw new Error(`Failed to export timeline: ${error.message}`);
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