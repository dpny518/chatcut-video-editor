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
      version: "1.0",
      timestamp: new Date().toISOString(),
      timeline: {
        clips: timelineClips.map(clip => {
          // Get the actual timeline action data for this clip
          const editorAction = timelineMetadata?.editorData?.actions?.find(
            action => action.id === clip.id
          );
  
          return {
            id: clip.id,
            source: {
              startTime: clip.startTime,
              endTime: clip.endTime,
              duration: clip.endTime - clip.startTime,
              name: clip.file.name
            },
            file: {
              name: clip.file.name,
              size: clip.file.size,
              type: clip.file.type
            },
            metadata: {
              originalDuration: clip.endTime - clip.startTime,
              timeline: {
                sourceStart: clip.startTime,
                sourceEnd: clip.endTime,
                start: editorAction?.start || 0,
                end: editorAction?.end || (clip.endTime - clip.startTime)
              }
            },
            position: {
              timelineStart: editorAction?.start || 0,
              timelineEnd: editorAction?.end || (clip.endTime - clip.startTime),
              row: editorAction?.data?.rowIndex || 0
            },
            state: {
              selected: clip.id === selectedClipId,
              effectId: editorAction?.effectId || 'default'
            }
          };
        }),
        duration: timelineMetadata.duration || 0,
        settings: {
          scale: timelineMetadata.scale || 1,
          effects: timelineMetadata.effects || {
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
          }
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

  const loadTimelineProject = useCallback((projectName) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      const project = savedProjects[projectName];
      
      if (!project) {
        throw new Error(`Timeline project "${projectName}" not found`);
      }
  
      console.log('Loading project:', project);
  
      // Validate all required media files are available
      const missingFiles = project.timeline.clips.filter(clip => {
        const fileName = clip.file?.name || clip.source?.name;
        console.log('Checking file:', fileName, 'Available files:', mediaFiles.map(f => f.name));
        return !mediaFiles.find(f => f.name === fileName);
      });
  
      if (missingFiles.length > 0) {
        throw new Error(
          `Missing media files: ${missingFiles.map(f => f.file?.name || f.source?.name).join(', ')}`
        );
      }
  
      // Convert project clips back to app format with proper timeline positions
      const loadedClips = project.timeline.clips.map(clip => {
        const fileName = clip.file?.name || clip.source?.name;
        const mediaFile = mediaFiles.find(f => f.name === fileName);
        
        console.log('Processing clip:', clip.id, 'File:', fileName, 'Found:', mediaFile);
  
        if (!mediaFile) {
          throw new Error(`Could not find media file: ${fileName}`);
        }
  
        return {
          id: clip.id,
          file: mediaFile,
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
          startTime: clip.source?.startTime || 0,
          endTime: clip.source?.endTime || 0,
          duration: clip.source?.duration || 0,
          metadata: {
            timeline: {
              start: clip.metadata?.timeline?.start || clip.position?.timelineStart || 0,
              end: clip.metadata?.timeline?.end || clip.position?.timelineEnd || 0,
              track: clip.metadata?.timeline?.track || clip.position?.row || 0
            }
          }
        };
      });
  
      console.log('Loaded clips:', loadedClips);
  
      setTimelineClips(loadedClips);
      setTimelineMetadata(prev => ({
        ...prev,
        scale: project.timeline.settings?.scale || 1,
        effects: project.timeline.settings?.effects || prev.effects,
        duration: project.timeline.duration || loadedClips.reduce((max, clip) => {
          const endTime = clip.metadata.timeline.end;
          return Math.max(max, endTime);
        }, 0)
      }));
      
      showNotification(`Timeline project "${projectName}" loaded successfully`, 'success');
      return true;
    } catch (error) {
      // Get savedProjects inside the catch block to avoid undefined reference
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      console.error('Failed to load timeline project:', error, {
        mediaFiles,
        projectName,
        project: savedProjects[projectName]
      });
      showNotification(error.message, 'error');
      return false;
    }
  }, [mediaFiles, setTimelineClips, setTimelineMetadata, showNotification]);

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