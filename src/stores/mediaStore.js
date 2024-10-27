import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

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

// Selectors
const createSelectors = (set, get) => ({
  selectFile: state => state.selectedFile,
  selectTranscripts: state => state.transcripts,
  selectTimelineClips: state => state.timelineClips,
  selectUploadProgress: state => state.uploadProgress,
  selectTimelineProjects: state => state.timelineProjects,
  selectSelectedTimelineProject: state => state.selectedTimelineProject,
  
  getTranscriptForFile: (filename) => {
    if (!filename) return null;
    const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
    return get().transcripts.get(transcriptName);
  },
  
  hasMatchingTranscript: (filename) => {
    if (!filename) return false;
    const transcriptName = filename.replace(/\.[^/.]+$/, '.json');
    return get().transcripts.has(transcriptName);
  }
});

// Actions
const createActions = (set, get) => ({
  // File actions
  setSelectedFile: (file) => set({ selectedFile: file }, false, 'setSelectedFile'),
  
  addFile: (file) => set(
    state => ({
      files: [...state.files, {
        id: Date.now().toString(),
        file,
        name: file.name,
        type: file.type,
        size: file.size
      }]
    }), 
    false, 
    'addFile'
  ),

  removeFile: (fileId) => set(
    state => ({
      files: state.files.filter(f => f.id !== fileId),
      selectedFile: state.selectedFile?.id === fileId ? null : state.selectedFile
    }), 
    false, 
    'removeFile'
  ),

  // Upload actions
  setUploadProgress: (fileId, progress) => set(
    state => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: progress }
    }), 
    false, 
    'setUploadProgress'
  ),

  clearUploadProgress: (fileId) => set(
    state => {
      const { [fileId]: removed, ...remaining } = state.uploadProgress;
      return { uploadProgress: remaining };
    }, 
    false, 
    'clearUploadProgress'
  ),

  setUploading: (status) => set({ uploading: status }, false, 'setUploading'),

  // Transcript actions
  addTranscript: (filename, data) => set(
    state => {
      const newTranscripts = new Map(state.transcripts);
      newTranscripts.set(filename, data);
      return { transcripts: newTranscripts };
    }, 
    false, 
    'addTranscript'
  ),

  // Timeline project actions
  saveTimelineProject: (name, data) => set(
    state => ({
      timelineProjects: {
        ...state.timelineProjects,
        [name]: {
          ...data,
          timestamp: Date.now()
        }
      },
      selectedTimelineProject: name
    }), 
    false, 
    'saveTimelineProject'
  ),

  loadTimelineProject: (name) => {
    const project = get().timelineProjects[name];
    if (project) {
      set({ 
        selectedTimelineProject: name,
        timelineClips: project.clips || []
      }, false, 'loadTimelineProject');
      return true;
    }
    return false;
  },

  deleteTimelineProject: (name) => set(
    state => {
      const { [name]: removed, ...remaining } = state.timelineProjects;
      return { 
        timelineProjects: remaining,
        selectedTimelineProject: state.selectedTimelineProject === name ? null : state.selectedTimelineProject
      };
    }, 
    false, 
    'deleteTimelineProject'
  ),

  // Timeline clip actions
  addTimelineClip: (clip) => set(
    state => ({
      timelineClips: [...state.timelineClips, {
        ...clip,
        id: clip.id || `clip-${Date.now()}`,
        timestamp: Date.now()
      }]
    }), 
    false, 
    'addTimelineClip'
  ),

  removeTimelineClip: (clipId) => set(
    state => ({
      timelineClips: state.timelineClips.filter(clip => clip.id !== clipId)
    }), 
    false, 
    'removeTimelineClip'
  ),

  // Selection actions
  setTranscriptSelection: (selection) => set(
    { transcriptSelection: selection }, 
    false, 
    'setTranscriptSelection'
  ),

  clearTranscriptSelection: () => set(
    { transcriptSelection: null }, 
    false, 
    'clearTranscriptSelection'
  ),

  // Notification actions
  setNotification: (message, severity = 'info') => set(
    { notification: message ? { message, severity } : null }, 
    false, 
    'setNotification'
  ),

  clearNotification: () => set({ notification: null }, false, 'clearNotification'),

  // Reset actions
  clearAll: () => set(initialState, false, 'clearAll'),
  
  clearUploadState: () => set(
    { uploadProgress: {}, uploading: false }, 
    false, 
    'clearUploadState'
  ),
  
  resetToInitial: () => set(initialState, false, 'resetToInitial')
});

const useMediaStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      ...createSelectors(set, get),
      ...createActions(set, get)
    }),
    {
      name: 'media-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        files: state.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size
        })),
        timelineProjects: state.timelineProjects,
        transcripts: Array.from(state.transcripts.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transcripts = new Map(state.transcripts || []);
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