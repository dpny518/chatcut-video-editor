// hooks/usePapercutActions.js
import { useCallback } from 'react';
import { usePapercuts } from '../../contexts/PapercutContext';
import { v4 as uuidv4 } from 'uuid';

export function usePapercutActions() {
  const { 
    addContentToPapercut, 
    cursorPosition,
    updateCursorPosition,
    updatePapercutContent,
    papercuts
  } = usePapercuts();

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
  
    const segmentIndex = content.findIndex(s => s.id === cursorPosition.segmentId);
    const currentSegment = content[segmentIndex];
    const wordIndex = currentSegment.words.findIndex(w => w.id === cursorPosition.wordId);
  
    // Check if we're at the start of a word in a segment with a same-speaker previous segment
    if (cursorPosition.isStartOfWord && segmentIndex > 0) {
      const previousSegment = content[segmentIndex - 1];
      if (previousSegment.speaker === currentSegment.speaker) {
        // Merge the segments
        const mergedSegment = {
          ...previousSegment,
          endTime: currentSegment.endTime,
          words: [
            ...previousSegment.words,
            ...currentSegment.words
          ].map((word, idx) => ({
            ...word,
            index: idx
          })),
          sourceReference: {
            ...previousSegment.sourceReference,
            wordRange: [
              previousSegment.sourceReference?.wordRange?.[0] || 0,
              previousSegment.words.length + currentSegment.words.length
            ]
          }
        };
  
        // Create new content array with merged segments
        return [
          ...content.slice(0, segmentIndex - 1),
          mergedSegment,
          ...content.slice(segmentIndex + 1)
        ];
      }
    }
  
    // Handle regular word deletion
    if (wordIndex > 0) {
      updateCursorPosition({
        segmentId: cursorPosition.segmentId,
        wordId: currentSegment.words[wordIndex - 1].id
      });
    } else if (segmentIndex > 0) {
      const previousSegment = content[segmentIndex - 1];
      const lastWord = previousSegment.words[previousSegment.words.length - 1];
      updateCursorPosition({
        segmentId: previousSegment.id,
        wordId: lastWord.id
      });
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
  }, [updateCursorPosition]);

  const mergeSegmentsWithSameSpeaker = useCallback((segments) => {
    return segments.reduce((acc, current) => {
      if (acc.length === 0) {
        return [current];
      }

      const lastSegment = acc[acc.length - 1];
      
      if (lastSegment.speaker === current.speaker) {
        // Merge the current segment with the last one
        const mergedSegment = {
          ...lastSegment,
          endTime: current.endTime,
          words: [
            ...lastSegment.words,
            ...current.words.map((word, idx) => ({
              ...word,
              index: lastSegment.words.length + idx
            }))
          ],
          sourceReference: {
            ...lastSegment.sourceReference,
            wordRange: [
              lastSegment.sourceReference?.wordRange?.[0] || 0,
              (lastSegment.words.length + current.words.length)
            ]
          }
        };
        return [...acc.slice(0, -1), mergedSegment];
      }

      return [...acc, current];
    }, []);
  }, []);

  const addToPapercut = useCallback((papercutId, selectedContent) => {
    const transformedContent = selectedContent.map(transformSegment);
    const mergedContent = mergeSegmentsWithSameSpeaker(transformedContent);
    addContentToPapercut(papercutId, mergedContent);
  }, [addContentToPapercut, transformSegment, mergeSegmentsWithSameSpeaker]);

  const insertToPapercut = useCallback((papercutId, selectedContent) => {
    console.log('Insert called with:', { papercutId, selectedContent, cursorPosition });
    
    if (!cursorPosition?.segmentId || !cursorPosition?.wordId) {
      console.log('No cursor position, falling back to append');
      const transformedContent = selectedContent.map((segment, index) => 
        transformSegment(segment, index)
      );
      const mergedContent = mergeSegmentsWithSameSpeaker(transformedContent);
      addContentToPapercut(papercutId, mergedContent);
      return;
    }
  
    // Get current content
    const papercut = papercuts.find(p => p.id === papercutId);
    if (!papercut) {
      console.warn('No papercut found with id:', papercutId);
      return;
    }
  
    // Find the segment containing the cursor
    const currentSegmentIndex = papercut.content.findIndex(
      segment => segment.id === cursorPosition.segmentId
    );
    
    // Find the word index within the segment
    const currentSegment = papercut.content[currentSegmentIndex];
    const wordIndex = currentSegment.words.findIndex(
      word => word.id === cursorPosition.wordId
    );
    
    // Check if cursor is at the end of the segment
    const isLastWord = wordIndex === currentSegment.words.length - 1;
    
    // If we're at the end of a segment, don't split it
    if (isLastWord) {
      const transformedContent = selectedContent.map((segment, index) => 
        transformSegment(segment, currentSegmentIndex + 1 + index)
      );
      const mergedContent = mergeSegmentsWithSameSpeaker(transformedContent);
      
      // Insert after the current segment without splitting
      const newContent = [
        ...papercut.content.slice(0, currentSegmentIndex + 1),
        ...mergedContent,
        ...papercut.content.slice(currentSegmentIndex + 1)
      ];
      
      updatePapercutContent(papercutId, newContent);
      
      // Get the last inserted segment
      const lastInsertedSegment = mergedContent[mergedContent.length - 1];
      
      // Set cursor to last word of inserted content
      if (lastInsertedSegment && lastInsertedSegment.words.length > 0) {
        const lastWord = lastInsertedSegment.words[lastInsertedSegment.words.length - 1];
        updateCursorPosition({
          segmentId: lastInsertedSegment.id,
          wordId: lastWord.id
        });
      }
      return;
    }
    
    // If not at the end, proceed with normal split and insert
    const splitContent = splitSegmentAtCursor(papercut.content, cursorPosition);
    const insertIndex = currentSegmentIndex + 1;
    
    const transformedContent = selectedContent.map((segment, index) => 
      transformSegment(segment, insertIndex + index)
    );
    const mergedContent = mergeSegmentsWithSameSpeaker(transformedContent);
    
    const newContent = [
      ...splitContent.slice(0, insertIndex),
      ...mergedContent,
      ...splitContent.slice(insertIndex)
    ];
    
    // Get the last inserted segment
    const lastInsertedSegment = mergedContent[mergedContent.length - 1];
    
    // Update the content
    updatePapercutContent(papercutId, newContent);
    
    // Set cursor to last word of inserted content
    if (lastInsertedSegment && lastInsertedSegment.words.length > 0) {
      const lastWord = lastInsertedSegment.words[lastInsertedSegment.words.length - 1];
      updateCursorPosition({
        segmentId: lastInsertedSegment.id,
        wordId: lastWord.id
      });
    }
  }, [cursorPosition, papercuts, transformSegment, splitSegmentAtCursor, 
      updatePapercutContent, addContentToPapercut, mergeSegmentsWithSameSpeaker, updateCursorPosition]);

  return {
    splitSegmentAtCursor,
    deleteWordAtCursor,
    addToPapercut,
    insertToPapercut,
    transformSegment
  };
}