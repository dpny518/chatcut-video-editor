// PapercutContent.js
import React, { useState, useCallback, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { useDragAndDrop } from '../../../hooks/usePapercut/useDragAndDrop';
import { Segment } from './Segment';
import WordMetadata from './WordMetadata';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from '../../../hooks/usePapercut/usePapercutActions';
import { usePapercutHistory } from '../../../hooks/usePapercutHistory';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';

const PapercutContent = ({ papercutId }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const theme = useTheme();
  const { getSpeakerColor } = useSpeakerColors();
  
  const {
    papercuts,
    cursorPosition,
    updateCursorPosition,
    updatePapercutContent
  } = usePapercuts();

  const { currentState, pushState, undo, redo, canUndo, canRedo } = usePapercutHistory();
  const { splitSegmentAtCursor, deleteWordAtCursor } = usePapercutActions();

  const content = useMemo(() => 
    papercuts.find(p => p.id === papercutId)?.content || [],
    [papercuts, papercutId]
  );

  const handleContentUpdate = useCallback((newContent, operation) => {
    const newState = {
      id: papercutId,
      content: newContent,
      metadata: {
        lastModified: Date.now(),
        operation
      }
    };
    pushState(newState);
    updatePapercutContent(papercutId, newContent);
  }, [papercutId, pushState, updatePapercutContent]);

  const handleDeleteSegment = useCallback((segmentId) => {
    const newContent = content.filter(segment => segment.id !== segmentId);
    handleContentUpdate(newContent, 'delete');
  }, [content, handleContentUpdate]);

  const dragState = useDragAndDrop(content, handleContentUpdate);

  const handleWordClick = useCallback((segmentId, wordId) => {
    updateCursorPosition({ segmentId, wordId });
  }, [updateCursorPosition]);

  const handleSegmentClick = useCallback((e, segmentId) => {
    // Don't trigger selection when clicking text or trash
    if (e.target.closest('.segment-text') || e.target.closest('.delete-button')) {
      return;
    }

    const currentIndex = content.findIndex(s => s.id === segmentId);

    if (e.metaKey || e.ctrlKey) {
      // Command/Ctrl click: Toggle selection without affecting others
      const newSelection = new Set(selectedSegments);
      if (newSelection.has(segmentId)) {
        newSelection.delete(segmentId);
      } else {
        newSelection.add(segmentId);
      }
      setSelectedSegments(newSelection);
      setLastSelectedIndex(currentIndex);
    } else if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift click: Select range from last selected to current
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeSelection = content
        .slice(start, end + 1)
        .map(s => s.id);
      setSelectedSegments(new Set(rangeSelection));
    } else {
      // Regular click: Select only this item
      if (selectedSegments.size === 1 && selectedSegments.has(segmentId)) {
        // Clicking the only selected item deselects it
        setSelectedSegments(new Set());
        setLastSelectedIndex(null);
      } else {
        // Select only this item
        setSelectedSegments(new Set([segmentId]));
        setLastSelectedIndex(currentIndex);
      }
    }
  }, [content, selectedSegments, lastSelectedIndex]);

  // Click on container to clear selection
  const handleContainerClick = useCallback((e) => {
    // Only clear if clicking directly on the container (not on segments)
    if (e.target === e.currentTarget) {
      setSelectedSegments(new Set());
      setLastSelectedIndex(null);
    }
  }, []);

  // PapercutContent.js
const handleKeyDown = useCallback((event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    event.preventDefault();
    if (event.shiftKey && canRedo) {
      redo();
    } else if (canUndo) {
      undo();
    }
    return;
  }

  if (!cursorPosition) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    const newContent = splitSegmentAtCursor(content, cursorPosition);
    handleContentUpdate(newContent, 'split');
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    const updatedContent = deleteWordAtCursor(content, cursorPosition);
    handleContentUpdate(updatedContent, 'delete');
  }

  // Arrow key navigation
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    
    const currentSegmentIndex = content.findIndex(s => s.id === cursorPosition.segmentId);
    const currentSegment = content[currentSegmentIndex];
    const currentWordIndex = currentSegment.words.findIndex(w => w.id === cursorPosition.wordId);

    if (event.key === 'ArrowLeft') {
      if (currentWordIndex > 0) {
        // Move to previous word in same segment
        updateCursorPosition({
          segmentId: cursorPosition.segmentId,
          wordId: currentSegment.words[currentWordIndex - 1].id
        });
      } else if (currentSegmentIndex > 0) {
        // Special case: if on first word and previous segment has same speaker
        const previousSegment = content[currentSegmentIndex - 1];
        if (previousSegment.speaker === currentSegment.speaker) {
          // Place cursor at start of current word to enable delete-to-join
          updateCursorPosition({
            segmentId: cursorPosition.segmentId,
            wordId: currentSegment.words[0].id,
            isStartOfWord: true // Optional: if you want to track cursor position within word
          });
        } else {
          // Different speaker, move to end of last word in previous segment
          const lastWord = previousSegment.words[previousSegment.words.length - 1];
          updateCursorPosition({
            segmentId: previousSegment.id,
            wordId: lastWord.id
          });
        }
      }
    } else if (event.key === 'ArrowRight') {
      if (currentWordIndex < currentSegment.words.length - 1) {
        // Move to next word in same segment
        updateCursorPosition({
          segmentId: cursorPosition.segmentId,
          wordId: currentSegment.words[currentWordIndex + 1].id
        });
      } else if (currentSegmentIndex < content.length - 1) {
        // Move to first word of next segment
        const nextSegment = content[currentSegmentIndex + 1];
        const firstWord = nextSegment.words[0];
        updateCursorPosition({
          segmentId: nextSegment.id,
          wordId: firstWord.id
        });
      }
    }
  }
}, [content, cursorPosition, canUndo, canRedo, undo, redo, 
    splitSegmentAtCursor, deleteWordAtCursor, handleContentUpdate, 
    updateCursorPosition]);

    return (
      <Box 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <Box 
          sx={{ 
            flex: 1,
            overflowY: 'auto'
          }}
          onClick={handleContainerClick}
        >
          {content.map(segment => (
            <Segment
              key={segment.id}
              segment={segment}
              dragState={dragState}
              isSelected={selectedSegments.has(segment.id)}
              isHovered={hoveredSegment === segment.id}
              theme={theme}
              getSpeakerColor={getSpeakerColor}
              onDeleteSegment={handleDeleteSegment}
              cursorPosition={cursorPosition}
              onWordClick={handleWordClick}
              onMouseEnter={setHoveredSegment}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={(e) => handleSegmentClick(e, segment.id)}
            />
          ))}
        </Box>
    
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 1000,
          }}
        >
          {cursorPosition && (
            <WordMetadata
              word={content
                .find(s => s.id === cursorPosition.segmentId)
                ?.words.find(w => w.id === cursorPosition.wordId)}
              segment={content.find(s => s.id === cursorPosition.segmentId)}
              segmentIndex={content.findIndex(s => s.id === cursorPosition.segmentId)}
              wordIndex={content
                .find(s => s.id === cursorPosition.segmentId)
                ?.words.findIndex(w => w.id === cursorPosition.wordId)}
              fileId={content
                .find(s => s.id === cursorPosition.segmentId)
                ?.sourceReference?.fileId}
            />
          )}
        </Box>
      </Box>
    );
};

export default PapercutContent;