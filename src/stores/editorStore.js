// src/stores/editorStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define initial state
const initialState = {
  // Media states
  mediaFiles: [],
  selectedBinClip: null,
  transcripts: new Map(),
  
  // Timeline states
  timelineClips: [],
  activeTimelineTranscripts: new Map(),
  timelineMetadata: {
    scale: 1,
    selectedClipId: null,
    duration: 0,
    isPlaying: false,
    currentTime: 0
  },
  
  // Project states
  selectedTimelineProject: null,
  timelineProjects: {},

  // UI states
  notification: null,
  loading: false,
  error: null
};

const useEditorStore = create(
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state

      // Notification actions
      setNotification: (message, severity = 'info') => set({
        notification: message ? { message, severity } : null
      }),

      clearNotification: () => set({ notification: null }),

      // Media actions
      addMediaFile: (file) => {
        try {
          const newFile = {
            id: Date.now().toString(),
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: Date.now()
          };
          set(state => ({ 
            mediaFiles: [...state.mediaFiles, newFile],
            error: null
          }));
          return newFile;
        } catch (error) {
          set({ error: error.message });
          return null;
        }
      },

      removeMediaFile: (fileId) => set(state => ({
        mediaFiles: state.mediaFiles.filter(f => f.id !== fileId),
        selectedBinClip: state.selectedBinClip?.id === fileId ? null : state.selectedBinClip
      })),

      setSelectedBinClip: (clip) => set({ selectedBinClip: clip }),

      // Transcript actions
      addTranscript: (filename, data) => set(state => {
        try {
          const newTranscripts = new Map(state.transcripts);
          newTranscripts.set(filename, {
            ...data,
            timestamp: Date.now()
          });
          return { 
            transcripts: newTranscripts,
            error: null
          };
        } catch (error) {
          return { error: 'Failed to add transcript' };
        }
      }),

      removeTranscript: (filename) => set(state => {
        const newTranscripts = new Map(state.transcripts);
        newTranscripts.delete(filename);
        return { transcripts: newTranscripts };
      }),

      hasMatchingTranscript: (filename) => {
        if (!filename) return false;
        const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
        return get().transcripts.has(transcriptName);
      },

      getTranscriptForFile: (filename) => {
        if (!filename) return null;
        const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
        return get().transcripts.get(transcriptName);
      },

      // Timeline actions
      addToTimeline: (clip) => {
        if (!clip) return;
        
        const state = get();
        const transcriptFileName = clip.file.name.replace(/\.[^/.]+$/, '.json');
        const transcriptData = state.getTranscriptForFile(clip.name);

        const enrichedClip = {
          ...clip,
          id: `clip-${Date.now()}`,
          transcriptFile: transcriptFileName,
          metadata: {
            timeline: {
              start: clip.startTime || 0,
              end: clip.endTime || clip.duration,
              duration: (clip.endTime || clip.duration) - (clip.startTime || 0)
            },
            transcript: transcriptData ? {
              data: transcriptData,
              segments: [] // Will be populated when needed
            } : null
          },
          timestamp: Date.now()
        };

        set(state => ({
          timelineClips: [...state.timelineClips, enrichedClip],
          timelineMetadata: {
            ...state.timelineMetadata,
            duration: Math.max(
              state.timelineMetadata.duration,
              enrichedClip.metadata.timeline.end
            )
          }
        }));

        // Update active transcripts if needed
        if (transcriptData) {
          set(state => {
            const newActiveTranscripts = new Map(state.activeTimelineTranscripts);
            newActiveTranscripts.set(transcriptFileName, transcriptData);
            return { activeTimelineTranscripts: newActiveTranscripts };
          });
        }
      },

      removeFromTimeline: (clipId) => set(state => ({
        timelineClips: state.timelineClips.filter(c => c.id !== clipId),
        timelineMetadata: {
          ...state.timelineMetadata,
          selectedClipId: state.timelineMetadata.selectedClipId === clipId ? 
            null : state.timelineMetadata.selectedClipId
        }
      })),

      updateTimelineClips: (newClips) => {
        const neededTranscripts = new Set(
          newClips.map(clip => clip.transcriptFile).filter(Boolean)
        );

        set(state => {
          const newActiveTranscripts = new Map();
          for (const [fileName, data] of state.activeTimelineTranscripts) {
            if (neededTranscripts.has(fileName)) {
              newActiveTranscripts.set(fileName, data);
            }
          }

          const maxDuration = newClips.reduce((max, clip) => 
            Math.max(max, clip.metadata?.timeline?.end || 0), 0);

          return {
            timelineClips: newClips,
            activeTimelineTranscripts: newActiveTranscripts,
            timelineMetadata: {
              ...state.timelineMetadata,
              duration: maxDuration
            }
          };
        });
      },

      updateTimelineMetadata: (metadata) => set(state => ({
        timelineMetadata: { ...state.timelineMetadata, ...metadata }
      })),

      // Project actions
      saveTimelineProject: (name) => set(state => ({
        timelineProjects: {
          ...state.timelineProjects,
          [name]: {
            clips: state.timelineClips,
            metadata: state.timelineMetadata,
            timestamp: Date.now()
          }
        },
        selectedTimelineProject: name
      })),

      loadTimelineProject: (name) => {
        const state = get();
        const project = state.timelineProjects[name];
        if (project) {
          set({
            timelineClips: project.clips || [],
            timelineMetadata: project.metadata || initialState.timelineMetadata,
            selectedTimelineProject: name,
            error: null
          });
          return true;
        }
        set({ error: 'Project not found' });
        return false;
      },

      deleteTimelineProject: (name) => set(state => {
        const { [name]: removed, ...remaining } = state.timelineProjects;
        return {
          timelineProjects: remaining,
          selectedTimelineProject: 
            state.selectedTimelineProject === name ? null : state.selectedTimelineProject
        };
      }),

      // Utility actions
      clearError: () => set({ error: null }),
      
      resetState: () => set(initialState),
      
      getState: () => get()
    }),
    {
      name: 'editor-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        mediaFiles: state.mediaFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          timestamp: file.timestamp
        })),
        timelineProjects: state.timelineProjects,
        transcripts: Array.from(state.transcripts.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Maps
          state.transcripts = new Map(state.transcripts || []);
          state.activeTimelineTranscripts = new Map();
          
          // Reset non-persistent state
          state.selectedBinClip = null;
          state.notification = null;
          state.loading = false;
          state.error = null;
        }
      }
    }
  )
);

export default useEditorStore;