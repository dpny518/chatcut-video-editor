// PapercutContent.js
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { useDragAndDrop } from '../../../hooks/usePapercut/useDragAndDrop';
import Segment from './Segment'; 
import WordMetadata from './WordMetadata';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from '../../../hooks/usePapercut/usePapercutActions';
import { usePapercutHistory } from '../../../hooks/usePapercutHistory';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';

const PapercutContent = ({ papercutId }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [nativeCursorPosition, setNativeCursorPosition] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const contentRef = useRef(null);
  const segmentRefs = useRef({});
  const theme = useTheme();
  const { getSpeakerColor } = useSpeakerColors();
  
  const {
    papercuts,
    cursorPosition,
    updateCursorPosition,
    updatePapercutContent,
    lastInsertedSegmentId
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

  const dragState = useDragAndDrop(content, handleContentUpdate, selectedSegments);

  const handleWordClick = useCallback((segmentId, wordId) => {
    updateCursorPosition({ segmentId, wordId });
  }, [updateCursorPosition]);

  const handleWordHover = useCallback((segmentId, wordId) => {
    const timerId = setTimeout(() => {
      setHoveredWord({ segmentId, wordId });
    }, 500);

    return () => clearTimeout(timerId);
  }, []);

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

  // Simplified scroll effect
  useEffect(() => {
    if (lastInsertedSegmentId) {
      const elementId = `segment-${lastInsertedSegmentId}`;
      const element = document.getElementById(elementId);
      
      if (element) {
        requestAnimationFrame(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        });
      }
    }
  }, [lastInsertedSegmentId]);

  // Add effect to handle hash changes and scrolling
  useEffect(() => {
    if (lastInsertedSegmentId) {
      // Set the URL hash to the segment ID
      window.location.hash = `segment-${lastInsertedSegmentId}`;
      
      // Clear the hash after scrolling (optional)
      const timeoutId = setTimeout(() => {
        window.history.replaceState(null, null, ' ');
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [lastInsertedSegmentId]);

  // Reset scroll flag when new content is inserted
  useEffect(() => {
    if (lastInsertedSegmentId) {
      setHasScrolled(false);
    }
  }, [lastInsertedSegmentId]);

  // Callback ref function to handle scrolling only on insert
  const setSegmentRef = useCallback((element, segmentId) => {
    if (element) {
      segmentRefs.current[segmentId] = element;
      
      // Only scroll if this is the newly inserted segment and we haven't scrolled yet
      if (segmentId === lastInsertedSegmentId && !hasScrolled) {
        setTimeout(() => {
          const container = contentRef.current;
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const elementTop = elementRect.top;
          const containerMiddle = containerRect.top + (containerRect.height / 2);
          
          const offset = elementTop - containerMiddle + (elementRect.height / 2);
          container.scrollBy({
            top: offset,
            behavior: 'smooth'
          });
          
          setHasScrolled(true);
        }, 100);
      }
    }
  }, [lastInsertedSegmentId, hasScrolled]);

  // Handle manual scroll
  const handleScroll = useCallback(() => {
    if (!hasScrolled && lastInsertedSegmentId) {
      setHasScrolled(true);
    }
  }, [hasScrolled, lastInsertedSegmentId]);

  const handleMouseMove = useCallback((e) => {
    const wordElement = e.target.closest('[data-word-id]');
    const segmentElement = e.target.closest('[data-segment-id]');
    
    if (wordElement && segmentElement) {
      const segmentId = segmentElement.getAttribute('data-segment-id');
      const wordId = wordElement.getAttribute('data-word-id');
      setNativeCursorPosition({ segmentId, wordId });
    } else {
      setNativeCursorPosition(null);
    }
  }, []);

  useEffect(() => {
    console.log('nativeCursorPosition changed:', nativeCursorPosition);
    if (nativeCursorPosition) {
      const timer = setTimeout(() => {
        console.log('Setting hoveredWord:', nativeCursorPosition);
        setHoveredWord(nativeCursorPosition);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log('Clearing hoveredWord');
      setHoveredWord(null);
    }
  }, [nativeCursorPosition]);

  useEffect(() => {
    if (nativeCursorPosition) {
      console.log('Cursor over word:', nativeCursorPosition);
      const timer = setTimeout(() => {
        console.log('Setting hovered word:', nativeCursorPosition);
        setHoveredWord(nativeCursorPosition);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log('Cursor not over word');
      setHoveredWord(null);
    }
  }, [nativeCursorPosition]);

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
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setNativeCursorPosition(null)}
    >
      <Box 
        ref={contentRef}
        sx={{ 
          flex: 1,
          overflowY: 'auto'
        }}
        onClick={handleContainerClick}
        onScroll={handleScroll}
      >
        {dragState.springs.map((style, index) => {
          const segment = content[index];
          console.log('Mapping segment:', segment);
          return (
            <Segment
                  key={segment.id}
                  ref={(el) => setSegmentRef(el, segment.id)}
                  segment={segment}
                  dragState={dragState}
                  isSelected={selectedSegments.has(segment.id)}
                  isHovered={hoveredSegment === segment.id}
                  theme={theme}
                  getSpeakerColor={getSpeakerColor}
                  onDeleteSegment={handleDeleteSegment}
                  cursorPosition={cursorPosition}
                  onWordClick={handleWordClick}
                  onWordHover={handleWordHover}  // Add this prop
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={(e) => handleSegmentClick(e, segment.id)}
                  style={style}
                />
          );
        })}
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
            {hoveredWord ? (
              <WordMetadata
                word={content
                  .find(s => s.id === hoveredWord.segmentId)
                  ?.words.find(w => w.id === hoveredWord.wordId)}
                segment={content.find(s => s.id === hoveredWord.segmentId)}
                segmentIndex={content.findIndex(s => s.id === hoveredWord.segmentId)}
                wordIndex={content
                  .find(s => s.id === hoveredWord.segmentId)
                  ?.words.findIndex(w => w.id === hoveredWord.wordId)}
                fileId={content
                  .find(s => s.id === hoveredWord.segmentId)
                  ?.sourceReference?.fileId}
              />
            ) : (
              <div>No word hovered</div>
            )}
          </Box>
    </Box>
  );
};

export default PapercutContent;
