import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';
import { usePapercut } from '../../../hooks/usePapercut';

const PapercutContent = ({ content, papercutId }) => {
  const { getSpeakerColor } = useSpeakerColors();
  const { splitSegmentAtCursor, deleteWordAtCursor } = usePapercut();
  const [cursorPosition, setCursorPosition] = useState(null);

  const handleWordClick = (segmentId, wordId) => {
    setCursorPosition({
      segmentId,
      wordId,
      position: 'end'
    });
  };

  const handleKeyDown = (event) => {
    if (!cursorPosition) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const newSegments = splitSegmentAtCursor(content, cursorPosition);
      if (newSegments) {
        // Handle the split segments
      }
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const updatedContent = deleteWordAtCursor(content, cursorPosition);
      if (updatedContent) {
        // Handle the updated content
      }
    }
  };

  if (!content || content.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Typography color="text.secondary">
          No content added yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 2
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {content.map(segment => (
        <Box 
          key={segment.id}
          sx={{ mb: 2 }}
        >
          <Box 
            sx={{ 
              mb: 2,
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
                letterSpacing: '0.1em'
              }}
            >
              {segment.speaker}
            </Typography>
            <Box>
              {segment.words.map((word, index) => (
                <Typography
                  key={word.id || index}
                  component="span"
                  variant="body2"
                  onClick={() => handleWordClick(segment.id, word.id)}
                  sx={{
                    display: 'inline-block',
                    cursor: 'pointer',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: 
                      cursorPosition?.segmentId === segment.id && 
                      cursorPosition?.wordId === word.id
                        ? 'action.selected' 
                        : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {word.text || word.word}
                  {cursorPosition?.segmentId === segment.id && 
                   cursorPosition?.wordId === word.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
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
              ))}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default PapercutContent;