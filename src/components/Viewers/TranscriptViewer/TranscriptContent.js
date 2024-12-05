import React from 'react';
import { 
  Box, 
  Typography 
} from '@mui/material';
import { 
  useSpeakerColors 
} from '../../../contexts/SpeakerColorContext';

const TranscriptContent = ({ 
  displayContent, 
  onSelectionChange,
  highlightedWord = null 
}) => {
  const contentRef = React.useRef(null);

  const { getSpeakerColor } = useSpeakerColors();

  const renderWord = (word, fileId) => (
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
      data-global-index={
        word.globalIndex
      }
      data-file-id={fileId}
      data-segment-index={
        word.position.segment
      }
      data-word-index={
        word.position.word
      }
      sx={{
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: highlightedWord && 
                word.id === highlightedWord.id ? 
                'action.selected' : 
                'transparent',
        '&:hover': {
          bgcolor: 'action.hover'
        },
      }}
    >
      {word.word}
    </Typography>
  );

  const renderSegment = (
    segment, 
    fileId
  ) => (
    <Box
      key={segment.globalIndex}
      data-segment-id={
        segment.globalIndex
      }
      sx={{ wordBreak: 'break-word' }}
    >
      {segment.words.map(word => 
        renderWord(
          word, 
          fileId
        )
      )}
    </Box>
  );

  const renderGroup = (
    group, 
    groupIndex, 
    fileId
  ) => {
    const speakerColor = 
      getSpeakerColor(
        group[0].speaker
      );
    
    return (
      <Box 
        key={
          `${fileId}-group-${groupIndex}`
        } 
        sx={{ 
          mb: 2,
          borderLeft: 3,
          borderColor: 
            speakerColor.colors.edgeLine,
          pl: 2
        }}
      >
        <Typography 
          variant="subtitle2"
          sx={{ 
            color: speakerColor.colors.text,
            textTransform: 'uppercase'
          }}
        >
          {group[0].speaker}
        </Typography>
        {group.map(segment => 
          renderSegment(
            segment, 
            fileId
          )
        )}
      </Box>
    );
  };

  const renderFile = file => (
    <Box key={file.fileId}>
      {file.groupedSegments.map(
        (group, groupIndex) => 
          renderGroup(
            group, 
            groupIndex, 
            file.fileId
          )
      )}
    </Box>
  );

  return (
    <Box 
      onMouseUp={onSelectionChange}
      sx={{ 
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {displayContent.map(renderFile)}
    </Box>
  );
};

export default TranscriptContent;