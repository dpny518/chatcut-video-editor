// src/stores/mediaStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define initial state
const initialState = {
  files: [],
  selectedFile: null,
  uploadProgress: {},
  uploading: false,
  transcripts: new Map(),
  timelineProjects: {},
  selectedTimelineProject: null,
  transcriptSelection: null,
  notification: null,
  timelineClips: []
};

const useMediaStore = create(
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state

      // Media file actions
      addFile: (file) => set((state) => ({
        files: [...state.files, {
          id: Date.now().toString(),
          file,
          name: file.name,
          type: file.type,
          size: file.size
        }]
      })),

      setSelectedFile: (file) => set({ selectedFile: file }),

      removeFile: (fileId) => set(state => ({
        files: state.files.filter(f => f.id !== fileId),
        selectedFile: state.selectedFile?.id === fileId ? null : state.selectedFile
      })),

      // Upload handling
      setUploadProgress: (fileId, progress) => set(state => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileId]: progress
        }
      })),

      clearUploadProgress: (fileId) => set(state => {
        const { [fileId]: removed, ...remaining } = state.uploadProgress;
        return { uploadProgress: remaining };
      }),

      setUploading: (status) => set({ uploading: status }),

      // Transcript handling
      addTranscript: (filename, data) => set(state => {
        const newTranscripts = new Map(state.transcripts);
        newTranscripts.set(filename, data);
        return { transcripts: newTranscripts };
      }),

      getTranscriptForFile: (filename) => {
        if (!filename) return null;
        const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
        return get().transcripts.get(transcriptName);
      },

      hasMatchingTranscript: (filename) => {
        if (!filename) return false;
        const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
        return get().transcripts.has(transcriptName);
      },

      // Timeline project management
      saveTimelineProject: (name, data) => set(state => ({
        timelineProjects: {
          ...state.timelineProjects,
          [name]: {
            ...data,
            timestamp: Date.now()
          }
        },
        selectedTimelineProject: name
      })),

      loadTimelineProject: (name) => {
        const project = get().timelineProjects[name];
        if (project) {
          set({ 
            selectedTimelineProject: name,
            timelineClips: project.clips || []
          });
          return true;
        }
        return false;
      },

      deleteTimelineProject: (name) => set(state => {
        const { [name]: removed, ...remaining } = state.timelineProjects;
        return { 
          timelineProjects: remaining,
          selectedTimelineProject: state.selectedTimelineProject === name ? null : state.selectedTimelineProject
        };
      }),

      // Timeline clip management
      addTimelineClip: (clip) => set(state => ({
        timelineClips: [...state.timelineClips, {
          ...clip,
          id: clip.id || `clip-${Date.now()}`,
          timestamp: Date.now()
        }]
      })),

      removeTimelineClip: (clipId) => set(state => ({
        timelineClips: state.timelineClips.filter(clip => clip.id !== clipId)
      })),

      // Transcript selection
      setTranscriptSelection: (selection) => set({ 
        transcriptSelection: selection 
      }),

      clearTranscriptSelection: () => set({ 
        transcriptSelection: null 
      }),

      // Notification handling
      setNotification: (message, severity = 'info') => set({
        notification: message ? { message, severity } : null
      }),

      clearNotification: () => set({ 
        notification: null 
      }),

      // Reset/Clear functions
      clearAll: () => set(initialState),

      clearUploadState: () => set({
        uploadProgress: {},
        uploading: false
      }),

      // Utility functions
      getState: () => get(),
      
      resetToInitial: () => set(initialState)
    }),
    {
      name: 'media-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        // Only persist these fields
        files: state.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size
          // Don't persist the actual file object
        })),
        timelineProjects: state.timelineProjects,
        transcripts: Array.from(state.transcripts.entries())
      }),
      onRehydrateStorage: () => (state) => {
        // Handle rehydration
        if (state) {
          // Restore Maps
          state.transcripts = new Map(state.transcripts || []);
          
          // Clear non-persistent state
          state.uploadProgress = {};
          state.uploading = false;
          state.notification = null;
          state.selectedFile = null;
          state.transcriptSelection = null;
        }
      }
    }
  )
);

export default useMediaStore;