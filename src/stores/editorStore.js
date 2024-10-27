import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Utility functions
const createMap = (entries = []) => new Map(entries);

// Initial state definition
const initialState = {
  isInitialized: false,
  mediaFiles: [],
  selectedBinClip: null,
  transcripts: new Map(),
  timelineClips: [],
  activeTimelineTranscripts: new Map(),
  timelineMetadata: {
    scale: 1,
    selectedClipId: null,
    duration: 0,
    isPlaying: false,
    currentTime: 0,
  },
  selectedTimelineProject: null,
  timelineProjects: {},
  notification: null,
  loading: false,
  error: null,
};

// Selector creation function
const createSelectors = (get) => ({
  getInitializationStatus: () => get().isInitialized,
  getMediaFiles: () => get().mediaFiles,
  getSelectedBinClip: () => get().selectedBinClip,
  getTranscripts: () => get().transcripts,
  getTimelineClips: () => get().timelineClips,
  getTimelineMetadata: () => get().timelineMetadata,
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
});

const useEditorStore = create(
  persist(
    (set, get) => {
      const selectors = createSelectors(get);

      return {
        ...initialState,
        ...selectors,

        initialize: () => set({ isInitialized: true }, false, 'initialize'),

        setNotification: (message, severity = 'info') =>
          set(
            {
              notification: message ? { message, severity } : null,
            },
            false,
            'setNotification'
          ),

        resetState: () =>
          set(
            (state) => ({
              ...initialState,
              isInitialized: state.isInitialized,
            }),
            false,
            'resetState'
          ),

        getState: () => get(),
      };
    },
    {
      name: 'editor-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        mediaFiles: state.mediaFiles.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          timestamp: file.timestamp,
        })),
        timelineProjects: state.timelineProjects,
        transcripts: Array.from(state.transcripts.entries()),
        isInitialized: state.isInitialized,
      }),
      // Wrapping `onRehydrateStorage` to access `set`
      onRehydrateStorage: (set) => (state) => {
        if (state) {
          state.transcripts = createMap(state.transcripts || []);
          state.activeTimelineTranscripts = new Map();
          state.selectedBinClip = null;
          state.notification = null;
          state.loading = false;
          state.error = null;
          set({ isInitialized: true }, false, 'initializeOnRehydrate');
        }
      },
    }
  )
);

export default useEditorStore;

