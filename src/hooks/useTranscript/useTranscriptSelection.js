// src/hooks/useTranscript/useTranscriptSelection.js

import { useState, useCallback, useEffect } from 'react';

export const useTranscriptSelection = (displayContent) => {
  const [selection, setSelection] = useState(null);

  const handleSelectionChange = useCallback(() => {
    const selectionObj = window.getSelection();
    if (selectionObj.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = selectionObj.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText) {
      const startNode = range.startContainer.parentElement;
      const endNode = range.endContainer.parentElement;
      
      setSelection({
        text: selectedText,
        start: {
          fileId: startNode.dataset.fileId,
          segmentIndex: parseInt(startNode.dataset.segmentIndex),
          wordIndex: parseInt(startNode.dataset.wordIndex),
          globalIndex: parseInt(startNode.dataset.globalIndex)
        },
        end: {
          fileId: endNode.dataset.fileId,
          segmentIndex: parseInt(endNode.dataset.segmentIndex),
          wordIndex: parseInt(endNode.dataset.wordIndex),
          globalIndex: parseInt(endNode.dataset.globalIndex)
        }
      });
    } else {
      setSelection(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection().removeAllRanges();
    setSelection(null);
  }, []);

  const getSelectedContent = useCallback(() => {
    if (!selection) {
      console.log('No selection available');
      return [];
    }

    console.log('Raw selection:', selection);

    const selectedContent = [];

    for (const file of displayContent) {
      if (file.fileId === selection.start.fileId) {
        for (const group of file.groupedSegments) {
          for (const segment of group) {
            const selectedWords = segment.words.filter(word => 
              word.globalIndex >= selection.start.globalIndex &&
              word.globalIndex <= selection.end.globalIndex
            );

            if (selectedWords.length > 0) {
              selectedContent.push({
                fileId: file.fileId,
                fileName: file.fileName,
                speaker: segment.speaker,
                words: selectedWords,
                startTime: selectedWords[0].start,
                endTime: selectedWords[selectedWords.length - 1].end,
                globalIndex: segment.globalIndex,
                // Add any other relevant metadata here
              });
            }
          }
        }
        break; // We've processed the file containing the selection, no need to continue
      }
    }

    console.log('Final selected content:', selectedContent);
    return selectedContent;
  }, [selection, displayContent]);

  return {
    selection,
    clearSelection,
    getSelectedContent,
    handleSelectionChange,
  };
};