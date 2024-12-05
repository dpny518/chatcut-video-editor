import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';
import { usePapercuts } from '../../../contexts/PapercutContext';
import WordMetadata from './WordMetadata';

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
    const segmentIndex = content.findIndex(s => s.id === segmentId);
    const wordIndex = content[segmentIndex].words.findIndex(w => w.id === wordId);
    updateCursorPosition({ segmentIndex, wordIndex });
  }, [updateCursorPosition, content]);
  
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
  }, [content, cursorPosition, splitSegmentAtCursor, deleteWordAtCursor, 
      updatePapercutContent, papercutId]);

      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Scrollable Content Area */}
          <Box 
          sx={{ 
            flex: 1,
            overflowY: 'scroll', // Enables vertical scrolling when content overflows
            overflowX: 'hidden', // Optional to disable horizontal scrolling
            p: 2,
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
                        onClick={() => handleWordClick(segment.id, word.id)}
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
    
          {/* Fixed Word Metadata at Bottom */}
          {cursorPosition && (
            <Box
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                p: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
              WordMetadata
              </Typography>
              {content
                .find(s => s.id === cursorPosition.segmentId)
                ?.words.find(w => w.id === cursorPosition.wordId)
                && (
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography variant="body2">
                      Word: {content.find(s => s.id === cursorPosition.segmentId)
                        .words.find(w => w.id === cursorPosition.wordId).text}
                    </Typography>
                    <Typography variant="body2">
                      Start Time: {content.find(s => s.id === cursorPosition.segmentId)
                        .words.find(w => w.id === cursorPosition.wordId).startTime}
                    </Typography>
                    <Typography variant="body2">
                      End Time: {content.find(s => s.id === cursorPosition.segmentId)
                        .words.find(w => w.id === cursorPosition.wordId).endTime}
                    </Typography>
                  </Box>
                )}
            </Box>
          )}
        </Box>
      );
    };
    
    export default PapercutContent;