import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSpeakerColors } from '../../../contexts/SpeakerColorContext';

const TranscriptContent = ({ 
  displayContent,
  onSelectionChange
}) => {
  const { getSpeakerColor } = useSpeakerColors();

  return (
    <Box onMouseUp={onSelectionChange}>
      {displayContent.map(file => (
        <Box key={file.fileId}>
          {file.groupedSegments.map((group, groupIndex) => {
            const speakerColor = getSpeakerColor(group[0].speaker);
            return (
              <Box 
                key={`${file.fileId}-group-${groupIndex}`} 
                sx={{ 
                  mb: 2,
                  borderLeft: 3,
                  borderColor: speakerColor.colors.edgeLine,
                  pl: 2
                }}
              >
                <Typography variant="subtitle2">
                  {group[0].speaker}
                </Typography>
                {group.map((segment) => (
                  <Box
                    key={segment.globalIndex}
                    data-segment-id={segment.globalIndex}
                  >
                    {segment.words.map((word) => (
                      <Typography
                        key={word.id}
                        component="span"
                        variant="body2"
                        data-word-id={word.id}
                        data-global-index={word.globalIndex}
                        data-file-id={file.fileId}
                        data-segment-index={word.position.segment}
                        data-word-index={word.position.word}
                        sx={{
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          },
                        }}
                      >
                        {word.word}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default TranscriptContent;