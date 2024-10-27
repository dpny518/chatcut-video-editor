// src/stores/transcriptStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialTranscriptState = {
  transcripts: new Map(),
  videoTranscriptMap: new Map(),
  timelineTranscripts: new Map(),
  activeTranscript: null,
  searchQuery: '',
  searchResults: [],
  currentHighlight: null
};

const useTranscriptStore = create(
  persist(
    (set, get) => ({
      ...initialTranscriptState, // Spread the initial state here

      // Transcript Management
      addTranscript: (filename, transcriptData) => set((state) => {
        const newTranscripts = new Map(state.transcripts);
        newTranscripts.set(filename, transcriptData);
        return { 
          transcripts: newTranscripts,
          searchResults: [] // Clear search when adding new transcript
        };
      }),

      removeTranscript: (filename) => set((state) => {
        const newTranscripts = new Map(state.transcripts);
        newTranscripts.delete(filename);
        const newVideoMap = new Map(state.videoTranscriptMap);
        for (const [video, transcript] of newVideoMap) {
          if (transcript === filename) {
            newVideoMap.delete(video);
          }
        }
        return { 
          transcripts: newTranscripts,
          videoTranscriptMap: newVideoMap
        };
      }),

      // Video-Transcript Mapping
      mapVideoToTranscript: (videoFilename, transcriptFilename) => set((state) => {
        const newMap = new Map(state.videoTranscriptMap);
        newMap.set(videoFilename, transcriptFilename);
        return { videoTranscriptMap: newMap };
      }),

      unmapVideo: (videoFilename) => set((state) => {
        const newMap = new Map(state.videoTranscriptMap);
        newMap.delete(videoFilename);
        return { videoTranscriptMap: newMap };
      }),

      // Timeline Transcript Management
      addTimelineTranscript: (clipId, segments) => set((state) => {
        const newTimelineTranscripts = new Map(state.timelineTranscripts);
        newTimelineTranscripts.set(clipId, {
          segments,
          timestamp: Date.now()
        });
        return { timelineTranscripts: newTimelineTranscripts };
      }),

      clearTimelineTranscript: (clipId) => set((state) => {
        const newTimelineTranscripts = new Map(state.timelineTranscripts);
        newTimelineTranscripts.delete(clipId);
        return { timelineTranscripts: newTimelineTranscripts };
      }),

      // Function to clear all timeline transcripts
      clearTimelineTranscripts: () => set(() => ({
        timelineTranscripts: new Map(),
        activeTranscript: null
      })),

      // Transcript Data Retrieval
      getTranscriptForVideo: (videoFilename) => {
        if (!videoFilename) return null;
        const state = get();
        const transcriptFilename = state.videoTranscriptMap.get(videoFilename);
        return transcriptFilename ? state.transcripts.get(transcriptFilename) : null;
      },

      getTimelineTranscript: (clipId) => {
        return get().timelineTranscripts.get(clipId)?.segments || null;
      },

      // Transcript Processing
      processClipTranscript: (clip) => {
        if (!clip) return null;
        
        const state = get();
        const transcriptData = clip.transcriptData || 
                             state.getTranscriptForVideo(clip.name);
        
        if (!transcriptData?.transcription) return null;

        const timelineStart = clip.metadata?.timeline?.start || 0;
        const timelineEnd = clip.metadata?.timeline?.end || clip.duration;

        const relevantSegments = transcriptData.transcription
          .map(segment => ({
            ...segment,
            words: segment.words.filter(word => 
              word.start >= clip.startTime && 
              word.end <= clip.endTime
            ).map(word => ({
              ...word,
              timelineStart: timelineStart + (word.start - clip.startTime),
              timelineEnd: timelineStart + (word.end - clip.startTime)
            }))
          }))
          .filter(segment => segment.words.length > 0);

        state.addTimelineTranscript(clip.id, relevantSegments);
        return relevantSegments;
      },

      // Search functionality
      setSearchQuery: (query) => set({ searchQuery: query }),

      searchTranscripts: (query) => set((state) => {
        if (!query.trim()) {
          return { searchResults: [] };
        }

        const results = [];
        for (const [clipId, transcript] of state.timelineTranscripts) {
          const matches = transcript.segments
            .flatMap(segment => 
              segment.words.filter(word => 
                word.word.toLowerCase().includes(query.toLowerCase())
              ).map(word => ({
                clipId,
                word: word.word,
                timelineStart: word.timelineStart,
                timelineEnd: word.timelineEnd,
                speaker: segment.segment.speaker
              }))
            );
          results.push(...matches);
        }

        return { 
          searchResults: results.sort((a, b) => a.timelineStart - b.timelineStart)
        };
      }),

      // Highlight management
      setCurrentHighlight: (highlight) => set({ currentHighlight: highlight }),

      clearHighlight: () => set({ currentHighlight: null }),

      // Active transcript management
      setActiveTranscript: (transcriptData) => set({ 
        activeTranscript: transcriptData 
      }),

      // Utility functions
      getWordAtTime: (time) => {
        const state = get();
        for (const transcript of state.timelineTranscripts.values()) {
          for (const segment of transcript.segments) {
            const word = segment.words.find(w => 
              time >= w.timelineStart && time <= w.timelineEnd
            );
            if (word) return word;
          }
        }
        return null;
      },

      getAllSpeakers: () => {
        const state = get();
        const speakers = new Set();
        for (const transcript of state.timelineTranscripts.values()) {
          transcript.segments.forEach(segment => 
            speakers.add(segment.segment.speaker)
          );
        }
        return Array.from(speakers);
      },

      // Cleanup
      clearState: () => set(initialTranscriptState) // Reset to initial state
    }),
    {
      name: 'transcript-storage',
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transcripts = new Map(state.transcripts || []);
          state.videoTranscriptMap = new Map(state.videoTranscriptMap || []);
          state.timelineTranscripts = new Map(state.timelineTranscripts || []);
        }
      }
    }
  )
);

export default useTranscriptStore;
