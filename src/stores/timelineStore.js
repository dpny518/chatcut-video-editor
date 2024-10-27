import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Define initial state as a frozen object to prevent accidental mutations
const initialState = Object.freeze({
  clips: [],
  selectedClipId: null,
  scale: 1,
  effects: [],
  error: null,
  isPlaying: false,
  currentTime: 0,
  editorData: {
    actions: [],
    duration: 0,
    rows: [{
      id: 'main',
      actions: []
    }]
  }
});

// Memoized selector functions
const createSelectors = (get) => ({
  // Basic selectors
  getClips: () => get().clips,
  getSelectedClip: () => {
    const state = get();
    return state.clips.find(clip => clip.id === state.selectedClipId);
  },
  getScale: () => get().scale,
  getEffects: () => get().effects,
  getError: () => get().error,
  getPlaybackState: () => ({
    isPlaying: get().isPlaying,
    currentTime: get().currentTime
  }),

  // Complex selectors
  getTimelineState: () => {
    const state = get();
    return {
      clips: state.clips,
      editorData: state.editorData,
      scale: state.scale,
    };
  },
  
  getEditorState: () => {
    const state = get();
    return {
      actions: state.editorData.actions,
      duration: state.editorData.duration,
      rows: state.editorData.rows
    };
  },

  // Computed selectors
  getClipDurations: () => {
    const clips = get().clips;
    return clips.reduce((acc, clip) => ({
      ...acc,
      [clip.id]: clip.metadata?.timeline?.duration || 0
    }), {});
  },

  getTotalDuration: () => {
    const actions = get().editorData.actions;
    return actions.length ? Math.max(...actions.map(a => a.end)) : 0;
  }
});

// Action creators
const createActions = (set, get) => ({
  // Basic actions with validation
  setScale: (scale) => {
    const validScale = Math.max(0.1, Math.min(10, scale));
    set({ scale: validScale });
  },

  setSelectedClipId: (id) => {
    const clips = get().clips;
    if (id === null || clips.some(clip => clip.id === id)) {
      set({ selectedClipId: id });
    }
  },

  setError: (error) => set({ error }),

  // Playback controls with validation
  setIsPlaying: (isPlaying) => {
    if (typeof isPlaying === 'boolean') {
      set({ isPlaying });
    }
  },

  setCurrentTime: (time) => {
    const validTime = Math.max(0, time);
    const duration = get().editorData.duration;
    set({ currentTime: Math.min(validTime, duration) });
  },

  // Editor data management with validation and error handling
  updateEditorData: (data) => {
    if (!data) return;

    try {
      const actions = Array.isArray(data.actions) ? data.actions : [];
      const duration = Math.max(...actions.map(a => a.end), data.duration || 0);

      set({
        editorData: {
          ...data,
          actions,
          rows: [{
            id: 'main',
            actions
          }],
          duration
        },
        error: null
      });
    } catch (error) {
      set({ error: 'Failed to update editor data' });
    }
  },

  // Clip management with optimistic updates and error handling
  addClip: (clip) => {
    if (!clip?.startTime || !clip?.endTime) return;

    try {
      const newClip = {
        ...clip,
        id: clip.id || `clip-${Date.now()}`,
        metadata: {
          timeline: {
            start: clip.startTime,
            end: clip.endTime,
            duration: clip.endTime - clip.startTime
          },
          playback: {
            start: clip.startTime,
            end: clip.endTime,
            duration: clip.endTime - clip.startTime
          }
        },
        timestamp: Date.now()
      };

      set(state => {
        const newClips = [...state.clips, newClip];
        return updateTimelineState(state, newClips);
      });
    } catch (error) {
      set({ error: 'Failed to add clip' });
    }
  },

  removeClip: (clipId) => {
    if (!clipId) return;

    set(state => {
      try {
        const newClips = state.clips.filter(clip => clip.id !== clipId);
        return updateTimelineState(state, newClips);
      } catch (error) {
        return { error: 'Failed to remove clip' };
      }
    });
  },

  updateClip: (clipId, updates) => {
    if (!clipId || !updates) return;

    set(state => {
      try {
        const newClips = state.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        );
        return updateTimelineState(state, newClips);
      } catch (error) {
        return { error: 'Failed to update clip' };
      }
    });
  },

  // Timeline operations
  clearTimeline: () => set(initialState),
  clearError: () => set({ error: null })
});

// Helper function to update timeline state
const updateTimelineState = (state, clips) => {
  const actions = clips.map(clip => ({
    id: clip.id,
    start: clip.metadata?.timeline?.start || 0,
    end: clip.metadata?.timeline?.end || 0,
    data: clip
  }));

  return {
    clips,
    selectedClipId: clips.some(c => c.id === state.selectedClipId) 
      ? state.selectedClipId 
      : null,
    editorData: {
      ...state.editorData,
      actions,
      rows: [{
        id: 'main',
        actions
      }],
      duration: actions.length ? Math.max(...actions.map(a => a.end)) : 0
    },
    error: null
  };
};

// Create the store
const useTimelineStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      ...createSelectors(get),
      ...createActions(set, get)
    }),
    {
      name: 'timeline-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        clips: state.clips,
        scale: state.scale,
        effects: state.effects
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset non-persistent state
          state.isPlaying = false;
          state.currentTime = 0;
          state.error = null;
          state.selectedClipId = null;
          
          // Update editor data based on restored clips
          const actions = state.clips.map(clip => ({
            id: clip.id,
            start: clip.metadata?.timeline?.start || 0,
            end: clip.metadata?.timeline?.end || clip.duration,
            data: clip
          }));

          state.editorData = {
            ...state.editorData,
            actions,
            rows: [{
              id: 'main',
              actions
            }],
            duration: actions.length ? Math.max(...actions.map(a => a.end)) : 0
          };
        }
      }
    }
  )
);

// Example usage:
// const clips = useTimelineStore(state => state.getClips(), shallow);
// const { isPlaying, currentTime } = useTimelineStore(state => state.getPlaybackState(), shallow);

export default useTimelineStore;