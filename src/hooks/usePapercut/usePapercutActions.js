// hooks/usePapercut/usePapercutActions.js
import { useCallback } from 'react';
import { usePapercuts } from '../../contexts/PapercutContext';
import { usePapercutHistory } from '../usePapercutHistory';
import { v4 as uuidv4 } from 'uuid';

export function usePapercutActions() {
  const { 
    addContentToPapercut, 
    cursorPosition,
    updatePapercutContent,
    papercuts
  } = usePapercuts();
  const { pushState } = usePapercutHistory();

  const transformSegment = useCallback((segment, index) => {
    const transformedSegment = {
      id: uuidv4(),
      speaker: segment.speaker,
      startTime: segment.start_time || segment.startTime,
      endTime: segment.end_time || segment.endTime,
      words: Array.isArray(segment.words) 
        ? segment.words.map((word, wordIndex) => ({
            id: uuidv4(),
            text: word.word || word.text,
            startTime: word.start || word.startTime,
            endTime: word.end || word.endTime,
            index: wordIndex
          }))
        : [{ 
            id: uuidv4(),
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
    return transformedSegment;
  }, []);

  const splitSegmentAtCursor = useCallback((content, cursorPosition) => {
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      return content;
    }

    return content.map(segment => {
      if (segment.id !== cursorPosition.segmentId) return segment;

      const wordIndex = segment.words.findIndex(w => w.id === cursorPosition.wordId);
      if (wordIndex === -1) return segment;

      const firstHalfBase = {
        ...segment,
        words: segment.words.slice(0, wordIndex + 1),
        endTime: segment.words[wordIndex].endTime,
        sourceReference: {
          ...segment.sourceReference,
          wordRange: [segment.sourceReference?.wordRange?.[0] || 0, wordIndex + 1]
        }
      };

      const secondHalfBase = {
        ...segment,
        words: segment.words.slice(wordIndex + 1),
        startTime: segment.words[wordIndex + 1]?.startTime || segment.endTime,
        sourceReference: {
          ...segment.sourceReference,
          wordRange: [wordIndex + 1, segment.words.length]
        }
      };

      const firstHalf = transformSegment(firstHalfBase, segment.sourceReference.index);
      const secondHalf = transformSegment(secondHalfBase, segment.sourceReference.index + 1);

      return [firstHalf, secondHalf];
    }).flat();
  }, [transformSegment]);

  const deleteWordAtCursor = useCallback((content, cursorPosition) => {
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      return content;
    }

    return content.map(segment => {
      if (segment.id !== cursorPosition.segmentId) return segment;

      const updatedWords = segment.words.filter(word => word.id !== cursorPosition.wordId)
        .map((word, idx) => ({
          ...word,
          index: idx
        }));
      
      if (updatedWords.length === 0) {
        return null;
      }

      return {
        ...segment,
        words: updatedWords,
        startTime: updatedWords[0]?.startTime || segment.startTime,
        endTime: updatedWords[updatedWords.length - 1]?.endTime || segment.endTime,
        sourceReference: {
          ...segment.sourceReference,
          wordRange: [0, updatedWords.length]
        }
      };
    }).filter(Boolean);
  }, []);

  const handleContentUpdate = useCallback((papercutId, newContent, operation) => {
    const newState = {
      id: papercutId,
      content: newContent,
      metadata: {
        lastModified: Date.now(),
        operation
      }
    };
    pushState(newState);
    addContentToPapercut(papercutId, newContent);
  }, [pushState, addContentToPapercut]);

  const addToPapercut = useCallback((papercutId, selectedContent) => {
    const transformedContent = selectedContent.map(transformSegment);
    handleContentUpdate(papercutId, transformedContent, 'add');
  }, [transformSegment, handleContentUpdate]);

  const insertToPapercut = useCallback((papercutId, selectedContent) => {
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      const transformedContent = selectedContent.map(transformSegment);
      handleContentUpdate(papercutId, transformedContent, 'add');
      return;
    }

    const papercut = papercuts.find(p => p.id === papercutId);
    if (!papercut) return;

    const originalIndex = papercut.content.findIndex(s => s.id === cursorPosition.segmentId);
    const splitContent = splitSegmentAtCursor(papercut.content, cursorPosition);
    const insertIndex = originalIndex + 1;
    
    const transformedContent = selectedContent.map((s, i) => transformSegment(s, insertIndex + i));
    const newContent = [
      ...splitContent.slice(0, insertIndex),
      ...transformedContent,
      ...splitContent.slice(insertIndex)
    ];

    handleContentUpdate(papercutId, newContent, 'insert');
  }, [cursorPosition, papercuts, transformSegment, splitSegmentAtCursor, handleContentUpdate]);

  return {
    splitSegmentAtCursor,
    deleteWordAtCursor,
    addToPapercut,
    insertToPapercut,
    transformSegment
  };
}