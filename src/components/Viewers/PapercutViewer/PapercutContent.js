import React, { useCallback, useMemo } from 'react';
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

  const content = useMemo(() => 
    papercuts.find(p => p.id === papercutId)?.content || [],
    [papercuts, papercutId]
  );

  const handleWordClick = useCallback((segmentId, wordId) => {
    const segmentIndex = content.findIndex(s => s.id === segmentId);
    const wordIndex = content[segmentIndex].words.findIndex(w => w.id === wordId);
    updateCursorPosition({ segmentId, wordId });
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

  const selectedWord = useMemo(() => {
    if (!cursorPosition) return null;
    return content
      .find(s => s.id === cursorPosition.segmentId)
      ?.words.find(w => w.id === cursorPosition.wordId);
  }, [content, cursorPosition]);

  const selectedWordAndSegment = useMemo(() => {
    if (!cursorPosition) return null;
    const segment = content.find(s => s.id === cursorPosition.segmentId);
    if (!segment) return null;
    const word = segment.words.find(w => w.id === cursorPosition.wordId);
    if (!word) return null;
    return { 
      word, 
      segment,
      segmentIndex: content.findIndex(s => s.id === cursorPosition.segmentId),
      wordIndex: segment.words.findIndex(w => w.id === cursorPosition.wordId)
    };
  }, [content, cursorPosition]);

  const selectedFileId = useMemo(() => {
    if (!cursorPosition) return null;
    return content
      .find(s => s.id === cursorPosition.segmentId)
      ?.sourceReference?.fileId;
  }, [content, cursorPosition]);


  
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
          overflowY: 'auto',
          overflowX: 'hidden',
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
       {selectedWordAndSegment && (
          <WordMetadata
            word={selectedWordAndSegment.word}
            segment={selectedWordAndSegment.segment}
            segmentIndex={selectedWordAndSegment.segmentIndex}
            wordIndex={selectedWordAndSegment.wordIndex}
            fileId={selectedWordAndSegment.segment.sourceReference?.fileId}
          />
        )}
      </Box>
    </Box>
  );
};

export default PapercutContent;