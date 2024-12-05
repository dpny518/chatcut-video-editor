import React, { useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';
import { usePapercuts } from '../../../contexts/PapercutContext';

const PapercutContent = ({ papercutId }) => {
  const { getSpeakerColor } = useSpeakerColors();
  const { 
    splitSegmentAtCursor, 
    deleteWordAtCursor, 
    papercuts, 
    cursorPosition,
    updateCursorPosition,
    updatePapercutContent
  } = usePapercuts();

  const content = papercuts.find(p => p.id === papercutId)?.content || [];

  const handleWordClick = useCallback((segmentId, wordId, word) => {
    updateCursorPosition({ segmentId, wordId, position: 'end' });
  }, [updateCursorPosition]);

  const handleKeyDown = useCallback((event) => {
    if (!cursorPosition) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const newContent = splitSegmentAtCursor(content, cursorPosition);
      updatePapercutContent(papercutId, newContent);
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const updatedContent = deleteWordAtCursor(content, cursorPosition);
      updatePapercutContent(papercutId, updatedContent);
    }
  }, [content, cursorPosition, splitSegmentAtCursor, deleteWordAtCursor, updatePapercutContent, papercutId]);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
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
                {segment.words.map((word) => (
                  <Typography
                    key={word.id}
                    component="span"
                    variant="body2"
                    onClick={() => handleWordClick(segment.id, word.id, word)}
                    sx={{
                      display: 'inline-block',
                      cursor: 'pointer',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 1,
                      position: 'relative',
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
                    {word.text}
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
      {cursorPosition && (
        <Paper 
          elevation={3}
          sx={{ 
            width: '300px', 
            p: 2, 
            position: 'sticky', 
            top: 0, 
            height: 'fit-content',
            maxHeight: '100%',
            overflow: 'auto'
          }}
        >
          <Typography variant="h6" gutterBottom>Word Metadata</Typography>
          {cursorPosition.segmentId && cursorPosition.wordId && (
            <>
              {content
                .find(s => s.id === cursorPosition.segmentId)
                ?.words.find(w => w.id === cursorPosition.wordId)
                && (
                  <>
                    <Typography><strong>Word:</strong> {content.find(s => s.id === cursorPosition.segmentId).words.find(w => w.id === cursorPosition.wordId).text}</Typography>
                    <Typography><strong>Start Time:</strong> {content.find(s => s.id === cursorPosition.segmentId).words.find(w => w.id === cursorPosition.wordId).startTime}</Typography>
                    <Typography><strong>End Time:</strong> {content.find(s => s.id === cursorPosition.segmentId).words.find(w => w.id === cursorPosition.wordId).endTime}</Typography>
                  </>
                )
              }
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PapercutContent;