import { useCallback } from 'react';

export const useTimelineStateManager = ({
  timelineClips,
  timelineMetadata,
  mediaFiles,
  selectedClipId,
  setTimelineClips,
  setTimelineMetadata,
  showNotification
}) => {
  const saveTimelineProject = useCallback((projectName) => {
    const timelineProject = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      timeline: {
        clips: timelineClips.map(clip => {
          const metadata = clip.metadata || {};
          const playback = metadata.playback || {};
          const timeline = metadata.timeline || {};

          return {
            id: clip.id,
            source: {
              startTime: playback.start,
              endTime: playback.end,
              duration: clip.source?.duration,
              name: clip.file.name
            },
            file: {
              name: clip.file.name,
              size: clip.file.size,
              type: clip.file.type,
              // Store blob data as base64 string
              data: clip.file instanceof Blob ? 
                new Promise(resolve => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(clip.file);
                }) : null
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
              selected: clip.id === selectedClipId,
              effectId: clip.effectId || 'default'
            }
          };
        }),
        duration: timelineMetadata.duration || 0,
        settings: {
          scale: timelineMetadata.scale || 1,
          effects: timelineMetadata.effects || {}
        }
      }
    };
  
    try {
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      savedProjects[projectName] = {
        ...timelineProject,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem('timelineProjects', JSON.stringify(savedProjects));
      showNotification(`Timeline project "${projectName}" saved successfully`, 'success');
      return true;
    } catch (error) {
      console.error('Failed to save timeline project:', error);
      showNotification('Failed to save timeline project', 'error');
      return false;
    }
  }, [timelineClips, timelineMetadata, selectedClipId, showNotification]);

  // Helper function to convert file data to File object
  const createFileFromData = useCallback(async (fileData) => {
    try {
      // If we have base64 data
      if (fileData.data) {
        // Convert base64 to blob
        const response = await fetch(fileData.data);
        const blob = await response.blob();
        return new File([blob], fileData.name, {
          type: fileData.type,
          lastModified: Date.now()
        });
      }
      // If we have a mediaFile reference
      else if (mediaFiles) {
        const mediaFile = mediaFiles.find(f => f.name === fileData.name);
        if (mediaFile?.data) {
          const response = await fetch(mediaFile.data);
          const blob = await response.blob();
          return new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: Date.now()
          });
        }
      }
      throw new Error(`No file data available for ${fileData.name}`);
    } catch (error) {
      console.error('Failed to create File:', error);
      throw error;
    }
  }, [mediaFiles]);

  const loadTimelineProject = useCallback(async (projectName) => {
    try {
      console.log('=== LOADING PROJECT START ===');
      
      if (!mediaFiles?.length) {
        throw new Error('No media files available');
      }

      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      const project = savedProjects[projectName];
      
      if (!project) {
        throw new Error(`Timeline project "${projectName}" not found`);
      }

      console.log('Loading project data:', project);

      // Process clips sequentially to handle async file conversion
      const loadedClips = [];
      for (const clip of project.timeline.clips) {
        try {
          // Create File object from stored data
          const fileObject = await createFileFromData(clip.file);
          if (!fileObject) {
            throw new Error(`Failed to create file for: ${clip.file.name}`);
          }

          const newClip = {
            id: clip.id,
            file: fileObject,
            startTime: clip.metadata.playback.start,
            endTime: clip.metadata.playback.end,
            duration: clip.metadata.playback.duration,
            metadata: {
              timeline: {
                start: clip.metadata.timeline.start,
                end: clip.metadata.timeline.end,
                duration: clip.metadata.timeline.duration
              },
              playback: {
                start: clip.metadata.playback.start,
                end: clip.metadata.playback.end,
                duration: clip.metadata.playback.duration
              }
            },
            source: {
              startTime: clip.metadata.timeline.sourceStart,
              endTime: clip.metadata.timeline.sourceEnd,
              duration: clip.metadata.originalDuration
            }
          };

          console.log('Created clip:', {
            id: newClip.id,
            startTime: newClip.startTime,
            endTime: newClip.endTime,
            file: {
              name: newClip.file.name,
              type: newClip.file.type,
              isFile: newClip.file instanceof File
            }
          });

          loadedClips.push(newClip);
        } catch (error) {
          console.error(`Failed to process clip ${clip.id}:`, error);
          throw error;
        }
      }

      console.log('Setting timeline clips:', loadedClips);
      setTimelineClips(loadedClips);
      setTimelineMetadata(prev => ({
        ...prev,
        scale: project.timeline.settings?.scale || 1
      }));
      
      console.log('=== LOADING PROJECT COMPLETE ===');
      showNotification(`Timeline project "${projectName}" loaded successfully`, 'success');
      return true;
    } catch (error) {
      console.error('=== LOADING PROJECT ERROR ===');
      console.error('Error details:', error);
      showNotification(error.message, 'error');
      return false;
    }
  }, [mediaFiles, setTimelineClips, setTimelineMetadata, showNotification, createFileFromData]);

  const deleteTimelineProject = useCallback((projectName) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      delete savedProjects[projectName];
      localStorage.setItem('timelineProjects', JSON.stringify(savedProjects));
      showNotification(`Timeline project "${projectName}" deleted`, 'success');
      return true;
    } catch (error) {
      console.error('Failed to delete timeline project:', error);
      showNotification('Failed to delete timeline project', 'error');
      return false;
    }
  }, [showNotification]);

  return {
    saveTimelineProject,
    loadTimelineProject,
    deleteTimelineProject
  };
};