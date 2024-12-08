// components/Viewers/PapercutViewer/SegmentWord.js
import React from 'react';
import { Typography, Box } from '@mui/material';

export const SegmentWord = React.memo(({ 
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
      onMouseLeave={() => onWordHover(null, null)}
      data-word-id={word.id}
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