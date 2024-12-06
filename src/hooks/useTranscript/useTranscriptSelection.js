import { useState, useCallback, useEffect } from 'react';
import { useTranscriptStyling } from '../../contexts/TranscriptStylingContext';

export const useTranscriptSelection = (displayContent) => {
  const [selection, setSelection] = useState(null);
  const { getWordStyle } = useTranscriptStyling();

  const isValidTranscriptNode = (node) => {
    // Check if the node is within the transcript viewer and has required data attributes
    if (!node) return false;
    
    // Walk up the DOM tree to find the closest element with data attributes
    let currentNode = node;
    while (currentNode && !currentNode.dataset?.fileId) {
      // If we reach the document body or exit the transcript viewer, the selection is invalid
      if (currentNode.tagName === 'BODY' || currentNode.id === 'root') {
        return false;
      }
      currentNode = currentNode.parentElement;
    }
    
    // Verify all required data attributes are present and valid
    return !!(
      currentNode?.dataset?.fileId &&
      currentNode?.dataset?.segmentIndex &&
      currentNode?.dataset?.wordIndex &&
      currentNode?.dataset?.globalIndex &&
      !isNaN(parseInt(currentNode.dataset.segmentIndex)) &&
      !isNaN(parseInt(currentNode.dataset.wordIndex)) &&
      !isNaN(parseInt(currentNode.dataset.globalIndex))
    );
  };

  const findValidNodesInRange = (range) => {
    // Get all nodes within the range
    const nodes = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Use isValidTranscriptNode for validation
          if (isValidTranscriptNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
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
    if (selectionObj.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const range = selectionObj.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText) {
      // Find all valid nodes in the selection range
      const validNodes = findValidNodesInRange(range);
      
      // Only process if we found valid transcript nodes
      if (validNodes.length > 0) {
        // Use the first and last valid nodes as our selection boundaries
        const startElement = validNodes[0];
        const endElement = validNodes[validNodes.length - 1];

        // Double-check that we have valid nodes before setting selection
        if (isValidTranscriptNode(startElement) && isValidTranscriptNode(endElement)) {
          setSelection({
            text: selectedText,
            start: {
              fileId: startElement.dataset.fileId,
              segmentIndex: parseInt(startElement.dataset.segmentIndex),
              wordIndex: parseInt(startElement.dataset.wordIndex),
              globalIndex: parseInt(startElement.dataset.globalIndex)
            },
            end: {
              fileId: endElement.dataset.fileId,
              segmentIndex: parseInt(endElement.dataset.segmentIndex),
              wordIndex: parseInt(endElement.dataset.wordIndex),
              globalIndex: parseInt(endElement.dataset.globalIndex)
            }
          });
        } else {
          setSelection(null);
        }
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
    if (!selection) {
      return [];
    }

    const selectedContent = [];

    for (const file of displayContent) {
      if (file.fileId !== selection.start.fileId && file.fileId !== selection.end.fileId) {
        continue;
      }

      for (const group of file.groupedSegments) {
        for (const segment of group) {
          const selectedWords = segment.words.filter(word => {
            const isInRange = 
              (file.fileId === selection.start.fileId ? word.globalIndex >= selection.start.globalIndex : true) &&
              (file.fileId === selection.end.fileId ? word.globalIndex <= selection.end.globalIndex : true);

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

  return {
    selection,
    clearSelection,
    getSelectedContent,
    handleSelectionChange,
  };
};