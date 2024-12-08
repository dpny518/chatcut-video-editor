import React, { useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';
import { useTranscriptStyling } from '../../../contexts/TranscriptStylingContext';
import { useTheme } from '@mui/material/styles';

const TranscriptContent = ({ displayContent, onSelectionChange, highlightedWord = null, selection, getSelectedContent, ...otherProps }) => {
  const contentRef = useRef(null);
  const theme = useTheme();

  const { getSpeakerColor } = useSpeakerColors();
  const { getWordStyle } = useTranscriptStyling();

  const handleDragStart = useCallback((e) => {
    if (!selection) {
      e.preventDefault();
      return;
    }
    const selectedContent = getSelectedContent();
    if (selectedContent && selectedContent.length > 0) {
      e.dataTransfer.setData('application/transcript-selection', JSON.stringify(selectedContent));
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      e.preventDefault();
    }
  }, [getSelectedContent, selection]);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && contentRef.current.contains(selection.anchorNode)) {
        const selectedText = selection.toString();
        if (selectedText) {
          onSelectionChange(selectedText);
        } else {
          onSelectionChange(null);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    if (contentRef.current) {
      contentRef.current.addEventListener('dragstart', handleDragStart);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (contentRef.current) {
        contentRef.current.removeEventListener('dragstart', handleDragStart);
      }
    };
  }, [onSelectionChange, handleDragStart]);

  const renderWord = (word, fileId) => {
    const style = getWordStyle(word.id);

    const redColors = {
      light: 'hsl(0, 65%, 60%)',
      dark: 'hsl(0, 65%, 45%)',
      textLight: 'hsl(0, 65%, 95%)',
      textDark: 'hsl(0, 65%, 15%)'
    };
    
    const greenColors = {
      light: 'hsl(137.508, 65%, 60%)',
      dark: 'hsl(137.508, 65%, 45%)',
      textLight: 'hsl(137.508, 65%, 95%)',
      textDark: 'hsl(137.508, 65%, 15%)'
    };
    
    const getStyleProps = (style, theme) => {
      const isDarkMode = theme.palette.mode === 'dark';
    
      switch (style) {
        case 'highlight-green':
          return {
            bgcolor: isDarkMode ? greenColors.dark : greenColors.light,
            color: isDarkMode ? greenColors.textDark : greenColors.textDark, // Always use textDark
          };
        case 'highlight-red':
          return {
            bgcolor: isDarkMode ? redColors.dark : redColors.light,
            color: isDarkMode ? redColors.textDark : redColors.textDark, // Always use textDark
          };
        case 'strikethrough':
          return {
            textDecoration: 'line-through',
            opacity: 0.7,
          };
        default:
          return {};
      }
    };
    return (
      <Typography
        key={word.id}
        component="span"
        variant="body2"
        ref={
          highlightedWord && 
          word.id === highlightedWord.id ? 
          (el) => {
            if (el) {
              el.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          } : 
          null
        }
        data-word-id={word.id}
        data-global-index={word.globalIndex}
        data-file-id={fileId}
        data-segment-index={word.position.segment}
        data-word-index={word.position.word}
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          bgcolor: highlightedWord && word.id === highlightedWord.id ? 'action.selected' : 'transparent',
          '&:hover': {
            bgcolor: 'action.hover'
          },
          ...getStyleProps(style, theme)
        }}
      >
        {word.word}
      </Typography>
    );
  };

  const renderSegment = (segment, fileId) => (
    <Box
      key={segment.globalIndex}
      data-segment-id={segment.globalIndex}
      sx={{ wordBreak: 'break-word' }}
    >
      {segment.words.map(word => renderWord(word, fileId))}
    </Box>
  );

  const renderGroup = (group, groupIndex, fileId) => {
    const speakerColor = getSpeakerColor(group[0].speaker);
    
    return (
      <Box 
        key={`${fileId}-group-${groupIndex}`} 
        sx={{ 
          mb: 2,
          borderLeft: 3,
          borderColor: speakerColor.colors.edgeLine,
          pl: 2
        }}
      >
        <Typography 
          variant="subtitle2"
          sx={{ 
            color: 'primary.main',
            textTransform: 'uppercase'
          }}
        >
          {group[0].speaker}
        </Typography>
        {group.map(segment => renderSegment(segment, fileId))}
      </Box>
    );
  };

  const renderFile = file => (
    <Box key={file.fileId}>
      {file.groupedSegments.map((group, groupIndex) => renderGroup(group, groupIndex, file.fileId))}
    </Box>
  );

  return (
    <Box
      ref={contentRef}
      draggable={!!selection}
      onDragStart={handleDragStart}
      sx={{
        padding: 2,
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        marginBottom: 2,
        userSelect: 'text', // Ensure text is selectable
      }}
      onMouseUp={onSelectionChange}
      {...otherProps}
    >
      {displayContent.map(renderFile)}
    </Box>
  );
};

export default TranscriptContent;