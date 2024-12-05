import { useCallback } from 'react';
import { usePapercuts } from '../../contexts/PapercutContext';

export function usePapercutActions() {
  const { addContentToPapercut } = usePapercuts();

  const splitSegmentAtCursor = useCallback((content, cursorPosition) => {
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      return content;
    }

    const segmentIndex = content.findIndex(s => s.id === cursorPosition.segmentId);
    if (segmentIndex === -1) return content;

    const segment = content[segmentIndex];
    const wordIndex = segment.words.findIndex(w => w.id === cursorPosition.wordId);
    if (wordIndex === -1) return content;

    const firstHalf = {
      ...segment,
      id: `segment-${Date.now()}-1`,
      words: segment.words.slice(0, wordIndex + 1),
      sourceReference: {
        ...segment.sourceReference,
        wordRange: [segment.sourceReference?.wordRange?.[0] || 0, wordIndex + 1]
      }
    };

    const secondHalf = {
      ...segment,
      id: `segment-${Date.now()}-2`,
      words: segment.words.slice(wordIndex + 1),
      sourceReference: {
        ...segment.sourceReference,
        wordRange: [wordIndex + 1, segment.words.length]
      }
    };

    return [
      ...content.slice(0, segmentIndex),
      firstHalf,
      secondHalf,
      ...content.slice(segmentIndex + 1)
    ];
  }, []);

  const deleteWordAtCursor = useCallback((content, cursorPosition) => {
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      return content;
    }

    return content.map(segment => {
      if (segment.id !== cursorPosition.segmentId) return segment;

      return {
        ...segment,
        words: segment.words.filter(word => word.id !== cursorPosition.wordId)
      };
    });
  }, []);

  const addToPapercut = useCallback((papercutId, selectedContent) => {
    const transformedContent = selectedContent.map(segment => ({
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      speaker: segment.speaker,
      words: Array.isArray(segment.words) 
        ? segment.words.map(word => ({
            id: `word-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: word.word || word.text,
            startTime: word.start || word.startTime,
            endTime: word.end || word.endTime
          }))
        : [{ // If segment.words is not an array, create a single word object
            id: `word-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: segment.text,
            startTime: segment.start,
            endTime: segment.end
          }],
      sourceReference: {
        fileId: segment.fileId,
        segmentId: segment.globalIndex
      }
    }));
  
    addContentToPapercut(papercutId, transformedContent);
  }, [addContentToPapercut]);

  return {
    splitSegmentAtCursor,
    deleteWordAtCursor,
    addToPapercut
  };
}