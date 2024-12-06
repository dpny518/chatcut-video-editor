import { useState, useCallback, useEffect } from 'react';
import { useTranscriptStyling } from '../../contexts/TranscriptStylingContext';

export const useTranscriptSelection = (displayContent) => {
  const [selection, setSelection] = useState(null);
  const { getWordStyle } = useTranscriptStyling();

  const isValidTranscriptNode = (node) => {
    if (!node || !node.dataset) return false;

    const { fileId, segmentIndex, wordIndex, globalIndex } = node.dataset;

    return !!(
      fileId &&
      !isNaN(parseInt(segmentIndex)) &&
      !isNaN(parseInt(wordIndex)) &&
      !isNaN(parseInt(globalIndex))
    );
  };

  const findValidNodesInRange = (range) => {
    if (!range || !range.commonAncestorContainer) {
      console.warn('Invalid range provided to findValidNodesInRange');
      return [];
    }

    const nodes = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => (isValidTranscriptNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
      }
    );

    let currentNode = walker.currentNode;
    while (currentNode) {
      if (range.intersectsNode(currentNode) && isValidTranscriptNode(currentNode)) {
        nodes.push(currentNode);
      }
      currentNode = walker.nextNode();
    }

    return nodes;
  };

  const handleSelectionChange = useCallback(() => {
    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = selectionObj.getRangeAt(0);
    if (!range) {
      setSelection(null);
      return;
    }

    const selectedText = range.toString().trim();
    if (!selectedText) {
      setSelection(null);
      return;
    }

    const validNodes = findValidNodesInRange(range);
    if (validNodes.length > 0) {
      const startElement = validNodes[0];
      const endElement = validNodes[validNodes.length - 1];

      if (isValidTranscriptNode(startElement) && isValidTranscriptNode(endElement)) {
        setSelection({
          text: selectedText,
          start: {
            fileId: startElement.dataset.fileId,
            segmentIndex: parseInt(startElement.dataset.segmentIndex),
            wordIndex: parseInt(startElement.dataset.wordIndex),
            globalIndex: parseInt(startElement.dataset.globalIndex),
          },
          end: {
            fileId: endElement.dataset.fileId,
            segmentIndex: parseInt(endElement.dataset.segmentIndex),
            wordIndex: parseInt(endElement.dataset.wordIndex),
            globalIndex: parseInt(endElement.dataset.globalIndex),
          },
        });
      } else {
        setSelection(null);
      }
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
    if (!selection) return [];

    const { start, end } = selection;

    if (!start || !end || !start.fileId || !end.fileId) {
      console.warn('Invalid selection boundaries:', selection);
      return [];
    }

    const selectedContent = [];
    for (const file of displayContent) {
      if (file.fileId !== start.fileId && file.fileId !== end.fileId) continue;

      for (const group of file.groupedSegments) {
        for (const segment of group) {
          const selectedWords = segment.words.filter((word) => {
            const isInRange =
              (file.fileId === start.fileId ? word.globalIndex >= start.globalIndex : true) &&
              (file.fileId === end.fileId ? word.globalIndex <= end.globalIndex : true);

            const style = getWordStyle(word.id);
            const isNotStrikethrough = style !== 'strikethrough';

            return isInRange && isNotStrikethrough;
          });

          if (selectedWords.length > 0) {
            selectedContent.push({
              fileId: file.fileId,
              fileName: file.fileName,
              speaker: segment.speaker,
              words: selectedWords,
              startTime: selectedWords[0].start,
              endTime: selectedWords[selectedWords.length - 1].end,
              globalIndex: segment.globalIndex,
            });
          }
        }
      }
    }

    return selectedContent;
  }, [selection, displayContent, getWordStyle]);

  useEffect(() => {
    console.log('Current selection:', selection);
  }, [selection]);

  return {
    selection,
    clearSelection,
    getSelectedContent,
    handleSelectionChange,
  };
};
