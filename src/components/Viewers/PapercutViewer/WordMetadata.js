import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Search } from 'lucide-react';
import { useFileSystem } from '../../../contexts/FileSystemContext';

const WordMetadata = ({ word, segment, segmentIndex, wordIndex, fileId }) => {
  const { files } = useFileSystem();

  if (!word || !segment) return null;

  const filename = fileId ? files[fileId]?.name || 'Unknown File' : 'No File';

  const findInSource = () => {
    console.log('Finding in source:', word);
    // Implement the logic to find the word in the source transcript
  };

  const formatTime = (time) => {
    if (!time) return 'Unknown';
    const date = new Date(0);
    date.setSeconds(time);
    return date.toISOString().substr(11, 8);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">Word Metadata</Typography>
        <Button
          size="small"
          startIcon={<Search size={16} />}
          onClick={findInSource}
        >
          Find in Source
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2">
          Word: {word.text}
        </Typography>
        <Typography variant="body2">
          Word Time: {formatTime(word.startTime)} - {formatTime(word.endTime)}
        </Typography>
        <Typography variant="body2">
          Word Index: {wordIndex}
        </Typography>
        <Typography variant="body2">
          Segment: {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
        </Typography>
        <Typography variant="body2">
          Segment Index: {segmentIndex}
        </Typography>
        <Typography variant="body2">
          Segment ID: {segment.sourceReference?.segmentId || 'Unknown'}
        </Typography>
        <Typography variant="body2">
          File: {filename}
        </Typography>
        <Typography variant="body2">
          File ID: {fileId || 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

export default WordMetadata;