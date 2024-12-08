import React, { forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { animated } from '@react-spring/web';
import Paper from '@mui/material/Paper';

const AnimatedPaper = animated(Paper);

const SegmentWord = React.memo(({ 
  word, 
  segment, 
  isSelected, 
  isStartOfWord, 
  onWordClick,
  onWordHover
}) => {
  return (
    <Typography
      component="span"
      variant="body2"
      onClick={() => onWordClick(segment.id, word.id)}
      onMouseEnter={() => onWordHover(segment.id, word.id)}
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
        userSelect: 'none'
      }}
    >
      {word.text}
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            ...(isStartOfWord ? { left: 0 } : { right: 0 }),
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
});

const Segment = forwardRef(({ 
  segment,
  dragState,
  isSelected,
  isHovered,
  theme,
  getSpeakerColor,
  onDeleteSegment,
  cursorPosition,
  onWordClick,
  onWordHover,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style
}, ref) => {
  const { 
    draggedSegment, 
    dropIndicator,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  } = dragState;

  const showDropIndicator = dropIndicator?.targetId === segment.id;
  const isBeingDragged = draggedSegment?.includes(segment.id);

  return (
    <Box
      ref={ref}
      id={`segment-${segment.id}`}
      className="relative"
      data-segment-id={segment.id}
      sx={{
        scrollMarginTop: '100px',
        marginBottom: '16px',
      }}
    >
      {/* Top drop indicator */}
      {showDropIndicator && dropIndicator.position === 'top' && (
        <Box 
          className="absolute -top-1 left-0 right-0 h-2 pointer-events-none"
          sx={{ zIndex: 2 }}
        >
          <Box className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-500" />
          <Box className="absolute left-0 top-0 w-1 h-2 bg-blue-500" />
          <Box className="absolute right-0 top-0 w-1 h-2 bg-blue-500" />
        </Box>
      )}

      <AnimatedPaper
        elevation={isBeingDragged ? 4 : 1}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, segment.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, segment)}
        onDrop={(e) => handleDrop(e, segment)}
        onClick={onClick}
        onMouseEnter={() => onMouseEnter(segment.id)}
        onMouseLeave={onMouseLeave}
        style={{
          ...style,
          position: 'relative',
          userSelect: 'none',
          backgroundColor: isSelected ? theme.palette.action.selected : theme.palette.background.paper,
          zIndex: style.zIndex || 'auto',
          transform: style?.transform || `translateY(0px) scale(1)`,
        }}
        sx={{ 
          transition: theme.transitions.create([
            'box-shadow', 
            'opacity',
            'background-color'
          ], {
            duration: theme.transitions.duration.shortest
          }),
          opacity: isBeingDragged ? 0.5 : 1,
          '&:hover .drag-handle': {
            opacity: 1
          },
          ...(isSelected && {
            '&:hover': {
              bgcolor: 'action.selected',
            }
          })
        }}
      >
        {/* Rest of the component remains the same */}
        <Box 
          className="segment-content"
          sx={{ 
            display: 'flex',
            alignItems: 'stretch',
            p: 2,
            pl: 0
          }}
        >
          <Box 
            className="drag-handle"
            sx={{ 
              opacity: 0,
              transition: theme.transitions.create('opacity'),
              cursor: 'grab',
              '&:active': {
                cursor: 'grabbing'
              },
              px: 2,
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'stretch',
              position: 'relative',
            }}
          >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <DragIndicatorIcon color="action" />
            </Box>
          </Box>

          <Box className="segment-text" sx={{ flexGrow: 1 }}>
            <Box 
              sx={{ 
                borderLeft: 3,
                borderColor: getSpeakerColor(segment.speaker).colors.edgeLine,
                pl: 2
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
                  letterSpacing: '0.1em',
                  cursor: 'default'
                }}
              >
                {segment.speaker}
              </Typography>
              <Box sx={{ cursor: 'text' }}>
                {segment.words.map((word) => (
                  <SegmentWord
                    key={word.id}
                    word={word}
                    segment={segment}
                    isSelected={cursorPosition?.segmentId === segment.id && 
                              cursorPosition?.wordId === word.id}
                    isStartOfWord={cursorPosition?.isStartOfWord}
                    onWordClick={onWordClick}
                    onWordHover={onWordHover}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {isHovered && (
          <Box
            className="delete-button"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
              cursor: 'pointer',
              zIndex: 3
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSegment(segment.id);
            }}
          >
            <DeleteIcon color="error" />
          </Box>
        )}
      </AnimatedPaper>

      {/* Bottom drop indicator */}
      {showDropIndicator && dropIndicator.position === 'bottom' && (
        <Box 
          className="absolute -bottom-1 left-0 right-0 h-2 pointer-events-none"
          sx={{ zIndex: 2 }}
        >
          <Box className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-500" />
          <Box className="absolute left-0 bottom-0 w-1 h-2 bg-blue-500" />
          <Box className="absolute right-0 bottom-0 w-1 h-2 bg-blue-500" />
        </Box>
      )}
    </Box>
  );
});

Segment.displayName = 'Segment';
export default Segment;