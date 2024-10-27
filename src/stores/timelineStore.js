// src/stores/timelineStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define initial state
const initialState = {
  // Timeline state
  clips: [],
  selectedClipId: null,
  scale: 1,
  effects: [],
  error: null,
  isPlaying: false,
  currentTime: 0,

  // Editor data
  editorData: {
    actions: [],
    duration: 0,
    rows: [{
      id: 'main',
      actions: []
    }]
  }
};

const useTimelineStore = create(
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state

      // Basic actions
      setScale: (scale) => set({ scale: Math.max(0.1, Math.min(10, scale)) }),
      
      setSelectedClipId: (id) => set({ selectedClipId: id }),
      
      setError: (error) => set({ error }),

      // Playback controls
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),

      // Editor data management
      updateEditorData: (data) => {
        if (!data) return;
        
        try {
          const actions = Array.isArray(data.actions) ? data.actions : [];
          
          set({
            editorData: {
              ...data,
              actions,
              rows: [{
                id: 'main',
                actions: actions
              }],
              duration: Math.max(
                ...actions.map(a => a.end),
                data.duration || 0
              )
            },
            error: null
          });
        } catch (error) {
          set({ error: 'Failed to update editor data' });
        }
      },

      // Clip management
      addClip: (clip) => {
        if (!clip) return;

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
            const actions = newClips.map(c => ({
              id: c.id,
              start: c.metadata.timeline.start,
              end: c.metadata.timeline.end,
              data: c
            }));

            return {
              clips: newClips,
              editorData: {
                ...state.editorData,
                actions,
                rows: [{
                  id: 'main',
                  actions: actions
                }],
                duration: Math.max(...actions.map(a => a.end))
              },
              error: null
            };
          });
        } catch (error) {
          set({ error: 'Failed to add clip' });
        }
      },

      removeClip: (clipId) => set(state => {
        try {
          const newClips = state.clips.filter(clip => clip.id !== clipId);
          const actions = newClips.map(clip => ({
            id: clip.id,
            start: clip.metadata.timeline.start,
            end: clip.metadata.timeline.end,
            data: clip
          }));

          return {
            clips: newClips,
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
            editorData: {
              ...state.editorData,
              actions,
              rows: [{
                id: 'main',
                actions: actions
              }],
              duration: actions.length ? Math.max(...actions.map(a => a.end)) : 0
            },
            error: null
          };
        } catch (error) {
          return { error: 'Failed to remove clip' };
        }
      }),

      updateClip: (clipId, updates) => set(state => {
        try {
          const newClips = state.clips.map(clip =>
            clip.id === clipId ? { ...clip, ...updates } : clip
          );

          const actions = newClips.map(clip => ({
            id: clip.id,
            start: clip.metadata.timeline.start,
            end: clip.metadata.timeline.end,
            data: clip
          }));

          return {
            clips: newClips,
            editorData: {
              ...state.editorData,
              actions,
              rows: [{
                id: 'main',
                actions: actions
              }],
              duration: Math.max(...actions.map(a => a.end))
            },
            error: null
          };
        } catch (error) {
          return { error: 'Failed to update clip' };
        }
      }),

      // Sync operations
      syncClipsToEditor: () => {
        const state = get();
        const actions = state.clips.map(clip => ({
          id: clip.id,
          start: clip.metadata?.timeline?.start || 0,
          end: clip.metadata?.timeline?.end || clip.duration,
          data: clip
        }));

        set({
          editorData: {
            ...state.editorData,
            actions,
            rows: [{
              id: 'main',
              actions: actions
            }],
            duration: actions.length ? Math.max(...actions.map(a => a.end)) : 0
          },
          error: null
        });
      },

      // Utility functions
      getTimelineState: () => {
        const state = get();
        return {
          clips: state.clips.map(clip => ({
            ...clip,
            timelinePosition: clip.metadata?.timeline || {}
          })),
          totalDuration: state.editorData.duration,
          settings: {
            scale: state.scale,
            effects: state.effects
          }
        };
      },

      // Reset functions
      clearTimeline: () => set(initialState),
      
      clearError: () => set({ error: null })
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
          
          // Sync editor data
          state.syncClipsToEditor?.();
        }
      }
    }
  )
);

export default useTimelineStore;