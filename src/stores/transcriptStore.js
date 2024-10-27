import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Utility functions
const createMap = (entries = []) => new Map(entries);

const initialTranscriptState = {
  transcripts: new Map(),
  videoTranscriptMap: new Map(),
  timelineTranscripts: new Map(),
  activeTranscript: null,
  searchState: {
    query: '',
    results: [],
    currentHighlight: null
  }
};

const createSelectors = (get) => ({
  getTranscriptForVideo: (videoFilename) => {
    if (!videoFilename) return null;
    const transcriptFilename = get().videoTranscriptMap.get(videoFilename);
    return transcriptFilename ? get().transcripts.get(transcriptFilename) : null;
  },

  getTimelineTranscript: (clipId) => 
    get().timelineTranscripts.get(clipId)?.segments || null,

  getWordAtTime: (time) => {
    const { timelineTranscripts } = get();
    for (const transcript of timelineTranscripts.values()) {
      const word = transcript.segments
        .flatMap(segment => segment.words)
        .find(w => time >= w.timelineStart && time <= w.timelineEnd);
      if (word) return word;
    }
    return null;
  },

  getAllSpeakers: () => {
    const { timelineTranscripts } = get();
    const speakers = new Set();
    for (const { segments } of timelineTranscripts.values()) {
      for (const { segment } of segments) {
        if (segment.speaker) speakers.add(segment.speaker);
      }
    }
    return Array.from(speakers);
  }
});

const createActions = (set, get) => ({
  addTranscript: (filename, transcriptData) => 
    set(
      state => ({
        transcripts: createMap([...state.transcripts, [filename, transcriptData]]),
        searchState: { ...state.searchState, results: [] }
      }),
      false,
      'addTranscript'
    ),

  removeTranscript: (filename) => 
    set(
      state => {
        const newTranscripts = createMap(state.transcripts);
        newTranscripts.delete(filename);
        
        const newVideoMap = createMap(
          Array.from(state.videoTranscriptMap.entries())
            .filter(([_, transcript]) => transcript !== filename)
        );
        
        return { 
          transcripts: newTranscripts,
          videoTranscriptMap: newVideoMap
        };
      },
      false,
      'removeTranscript'
    ),

  mapVideoToTranscript: (videoFilename, transcriptFilename) => 
    set(
      state => ({
        videoTranscriptMap: createMap([
          ...state.videoTranscriptMap,
          [videoFilename, transcriptFilename]
        ])
      }),
      false,
      'mapVideoToTranscript'
    ),

  processClipTranscript: (clip) => {
    if (!clip?.id) return;
    
    const state = get();
    const transcriptData = clip.transcriptData || 
                         state.getTranscriptForVideo(clip.name);
    
    if (!transcriptData?.transcription) return;

    const timelineStart = clip.metadata?.timeline?.start || 0;
    const processedSegments = transcriptData.transcription
      .reduce((acc, segment) => {
        const filteredWords = segment.words
          .filter(word => 
            word.start >= clip.startTime && 
            word.end <= clip.endTime
          )
          .map(word => ({
            ...word,
            timelineStart: timelineStart + (word.start - clip.startTime),
            timelineEnd: timelineStart + (word.end - clip.startTime)
          }));

        if (filteredWords.length > 0) {
          acc.push({
            ...segment,
            words: filteredWords
          });
        }
        return acc;
      }, []);

    if (processedSegments.length > 0) {
      set(
        state => ({
          timelineTranscripts: createMap([
            ...state.timelineTranscripts,
            [clip.id, { segments: processedSegments, timestamp: Date.now() }]
          ])
        }),
        false,
        'processClipTranscript'
      );
    }
  },

  clearTimelineTranscripts: () => 
    set(
      () => ({
        timelineTranscripts: new Map(),
        activeTranscript: null
      }),
      false,
      'clearTimelineTranscripts'
    ),

  updateSearch: (query) => 
    set(
      state => {
        if (!query.trim()) {
          return { 
            searchState: { 
              ...state.searchState, 
              query, 
              results: [] 
            } 
          };
        }

        const searchQuery = query.toLowerCase();
        const results = [];
        
        for (const [clipId, transcript] of state.timelineTranscripts) {
          for (const segment of transcript.segments) {
            for (const word of segment.words) {
              if (word.word.toLowerCase().includes(searchQuery)) {
                results.push({
                  clipId,
                  word: word.word,
                  timelineStart: word.timelineStart,
                  timelineEnd: word.timelineEnd,
                  speaker: segment.segment.speaker
                });
              }
            }
          }
        }

        results.sort((a, b) => a.timelineStart - b.timelineStart);

        return { 
          searchState: { 
            ...state.searchState,
            query,
            results,
            currentHighlight: null 
          }
        };
      },
      false,
      'updateSearch'
    ),

  setCurrentHighlight: (highlight) => 
    set(
      state => ({
        searchState: { ...state.searchState, currentHighlight: highlight }
      }),
      false,
      'setCurrentHighlight'
    ),

  clearState: () => set(initialTranscriptState, false, 'clearState')
});

const useTranscriptStore = create(
  persist(
    (set, get) => ({
      ...initialTranscriptState,
      ...createSelectors(get),
      ...createActions(set, get)
    }),
    {
      name: 'transcript-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transcripts: Array.from(state.transcripts.entries()),
        videoTranscriptMap: Array.from(state.videoTranscriptMap.entries()),
        timelineTranscripts: Array.from(state.timelineTranscripts.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.transcripts = createMap(state.transcripts);
          state.videoTranscriptMap = createMap(state.videoTranscriptMap);
          state.timelineTranscripts = createMap(state.timelineTranscripts);
        }
      }
    }
  )
);

export default useTranscriptStore;