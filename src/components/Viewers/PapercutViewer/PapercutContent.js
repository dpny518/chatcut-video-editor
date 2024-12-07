import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography,
  Paper,
  Fade,
  useTheme
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from '../../../hooks/usePapercut/usePapercutActions';
import { usePapercutHistory } from '../../../hooks/usePapercutHistory';
import WordMetadata from './WordMetadata';
import DeleteIcon from '@mui/icons-material/Delete';

const PapercutContent = ({ papercutId }) => {
  const theme = useTheme();
  const { getSpeakerColor } = useSpeakerColors();
  const { 
    papercuts, 
    cursorPosition,
    updateCursorPosition,
    updatePapercutContent
  } = usePapercuts();

  const {
    splitSegmentAtCursor,
    deleteWordAtCursor
  } = usePapercutActions();

  const { currentState, pushState, undo, redo, canUndo, canRedo } = usePapercutHistory();
  
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Drag state
  const [draggedSegment, setDraggedSegment] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragStart = (e, segmentId) => {
    e.dataTransfer.setData('text/plain', segmentId);
    setDraggedSegment(segmentId);
    setIsDragging(true);

    // Create a custom drag image
    const dragPreview = document.createElement('div');
    dragPreview.style.width = '200px';
    dragPreview.style.padding = '8px';
    dragPreview.style.background = theme.palette.background.paper;
    dragPreview.style.borderRadius = '4px';
    dragPreview.style.boxShadow = theme.shadows[4];
    dragPreview.textContent = 'Moving segment...';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 100, 20);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  const handleDragOver = (e, segmentId) => {
    e.preventDefault();
    if (segmentId === draggedSegment) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'top' : 'bottom';
    
    setDropTarget(segmentId);
    setDropPosition(position);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the segment
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
      setDropPosition(null);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedSegment(null);
    setDropTarget(null);
    setDropPosition(null);
  };



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

  const handleDrop = useCallback((e, targetSegmentId) => {
    e.preventDefault();
    const sourceSegmentId = e.dataTransfer.getData('text/plain');
    
    if (sourceSegmentId === targetSegmentId) return;

    const sourceIndex = content.findIndex(s => s.id === sourceSegmentId);
    let targetIndex = content.findIndex(s => s.id === targetSegmentId);

    if (dropPosition === 'bottom') {
      targetIndex += 1;
    }

    const newContent = [...content];
    const [removedSegment] = newContent.splice(sourceIndex, 1);
    newContent.splice(targetIndex, 0, removedSegment);

    handleContentUpdate(newContent, 'move');
    handleDragEnd();
  }, [content, dropPosition, handleContentUpdate]);

  useEffect(() => {
    if (currentState?.id === papercutId && currentState?.content) {
      updatePapercutContent(papercutId, currentState.content);
    }
  }, [currentState, papercutId, updatePapercutContent]);

  const handleWordClick = useCallback((segmentId, wordId) => {
    const segmentIndex = content.findIndex(s => s.id === segmentId);
    const wordIndex = content[segmentIndex].words.findIndex(w => w.id === wordId);
    updateCursorPosition({ segmentId, wordId });
  }, [updateCursorPosition, content]);

  const renderWord = useCallback((word, segment) => {
    const isSelected = cursorPosition?.segmentId === segment.id && 
                       cursorPosition?.wordId === word.id;
    const showLeftCursor = isSelected && cursorPosition?.isStartOfWord;
    
    return (
      <Typography
        key={word.id}
        component="span"
        variant="body2"
        onClick={() => handleWordClick(segment.id, word.id)}
        sx={{
          display: 'inline-block',
          cursor: 'pointer',
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          position: 'relative',
          backgroundColor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          // Prevent text from being draggable
          userSelect: 'none',
          // Ensure text doesn't show grab cursor
          '& *': {
            cursor: 'pointer'
          }
        }}
      >
        {word.text}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              ...(showLeftCursor ? { left: 0 } : { right: 0 }),
              top: 0,
              width: 2,
              height: '100%',
              backgroundColor: 'primary.main',
              animation: 'blink 1s step-end infinite',
              '@keyframes blink': {
                '50%': {
                  opacity: 0
                }
              }
            }}
          />
        )}
      </Typography>
    );
  }, [cursorPosition, handleWordClick]);

  const renderSegment = useCallback((segment) => (
    <Fade in key={segment.id}>
      <Paper
        elevation={draggedSegment === segment.id ? 0 : dropTarget === segment.id ? 4 : 1}
        draggable
        onDragStart={(e) => handleDragStart(e, segment.id)}
        onDragOver={(e) => handleDragOver(e, segment.id)}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, segment.id)}
        onMouseEnter={() => setHoveredSegment(segment.id)}
        onMouseLeave={() => setHoveredSegment(null)}
        sx={{ 
          mb: 2,
          position: 'relative',
          transition: theme.transitions.create(['box-shadow', 'transform', 'opacity']),
          opacity: draggedSegment === segment.id ? 0.4 : 1,
          transform: dropTarget === segment.id 
            ? `translateY(${dropPosition === 'top' ? -8 : 8}px)`
            : 'none',
          // Make entire paper draggable with grab cursor
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          },
          // Hide drag handle since whole segment is draggable
          '& .drag-handle': {
            display: 'none'
          }
        }}
      >
        {/* Drop zone indicators */}
        <Fade in={dropTarget === segment.id && dropPosition === 'top'}>
          <Box sx={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'primary.main',
            borderRadius: 2,
            zIndex: 1
          }} />
        </Fade>
        <Fade in={dropTarget === segment.id && dropPosition === 'bottom'}>
          <Box sx={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'primary.main',
            borderRadius: 2,
            zIndex: 1
          }} />
        </Fade>

        {/* Segment content */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'flex-start',
          p: 2
        }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box 
              sx={{ 
                borderLeft: 3,
                borderColor: getSpeakerColor(segment.speaker).colors.edgeLine,
                pl: 2,
                // Prevent text selection while dragging
                userSelect: 'none'
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'primary.main',
                  mb: 0.5,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                {segment.speaker}
              </Typography>
              <Box>
                {segment.words.map((word) => renderWord(word, segment))}
              </Box>
            </Box>
          </Box>
        </Box>

        {hoveredSegment === segment.id && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
              // Override grab cursor for delete icon
              cursor: 'pointer',
              zIndex: 2
            }}
            onClick={() => handleDeleteSegment(segment.id)}
          >
            <DeleteIcon color="error" />
          </Box>
        )}
      </Paper>
    </Fade>
  ), [draggedSegment, dropTarget, dropPosition, getSpeakerColor, handleDragStart, 
      handleDragOver, handleDragLeave, handleDragEnd, handleDrop, renderWord, 
      handleDeleteSegment, hoveredSegment, theme]);

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
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        p: 2
      }}>
        {content.map(renderSegment)}
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

