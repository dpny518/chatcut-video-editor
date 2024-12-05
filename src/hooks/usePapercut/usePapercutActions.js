import { useCallback } from 'react';
import { usePapercuts } from '../../contexts/PapercutContext';

export function usePapercutActions() {
  const { addContentToPapercut, insertContentToPapercut, cursorPosition } = usePapercuts();

  const transformSegment = useCallback((segment, index) => {
    console.log('Input segment:', segment);
    
    const transformedSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      speaker: segment.speaker,
      startTime: segment.start_time || segment.startTime,
      endTime: segment.end_time || segment.endTime,
      words: Array.isArray(segment.words) 
        ? segment.words.map((word, wordIndex) => {
            const transformedWord = {
              id: `word-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              text: word.word || word.text,
              startTime: word.start || word.startTime,
              endTime: word.end || word.endTime,
              index: wordIndex
            };
            console.log('Transformed word:', transformedWord);
            return transformedWord;
          })
        : [{ 
            id: `word-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: segment.text,
            startTime: segment.start_time || segment.startTime,
            endTime: segment.end_time || segment.endTime,
            index: 0
          }],
      sourceReference: {
        fileId: segment.fileId,
        segmentId: segment.globalIndex || segment.id,
        index: index
      }
    };
  
    console.log('Transformed segment:', transformedSegment);
    return transformedSegment;
  }, []);

  const addToPapercut = useCallback((papercutId, selectedContent) => {
    const transformedContent = selectedContent.map(transformSegment);
    addContentToPapercut(papercutId, transformedContent);
  }, [addContentToPapercut, transformSegment]);


  const insertToPapercut = useCallback((papercutId, selectedContent) => {
    if (cursorPosition) {
      const transformedContent = selectedContent.map((segment, index) => transformSegment(segment, index));
      insertContentToPapercut(papercutId, transformedContent, cursorPosition);
    } else {
      console.warn('No cursor position set for insert operation');
    }
  }, [insertContentToPapercut, cursorPosition, transformSegment]);

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

  return {
    splitSegmentAtCursor,
    deleteWordAtCursor,
    addToPapercut,
    insertToPapercut
  };
}