import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Search } from 'lucide-react';
import { useFileSystem } from '../../../contexts/FileSystemContext';
import { usePapercuts } from '../../../contexts/PapercutContext';

const WordMetadata = ({ word, fileId }) => {
  const { files } = useFileSystem();
  const { papercuts, activeTab } = usePapercuts();

  if (!word) return null;

  const filename = fileId ? files[fileId]?.name || 'Unknown File' : 'No File';

  const findInSource = () => {
    // Implement the logic to find the word in the source transcript
    console.log('Finding in source:', word);
    // You might want to dispatch an action or use a callback prop here
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        position: 'absolute',
        bottom: 0,
        right: 0,
        bgcolor: 'background.paper',
        p: 2,
        borderTop: 1,
        borderLeft: 1,
        borderColor: 'divider',
        borderTopLeftRadius: 1,
        zIndex: 1,
        minWidth: '200px'
      }}
    >
      <Box sx={{ 
        typography: 'subtitle2', 
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>Word Metadata</span>
        <Button
          size="small"
          startIcon={<Search size={16} />}
          onClick={findInSource}
          sx={{ minWidth: 'auto' }}
        >
          Find in Source
        </Button>
      </Box>
      <Typography variant="body2">
        Word: {word.text}
      </Typography>
      <Typography variant="body2">
        Start Time: {word.startTime}
      </Typography>
      <Typography variant="body2">
        End Time: {word.endTime}
      </Typography>
      <Typography variant="body2">
        File: {filename}
      </Typography>
    </Paper>
  );
};

export default WordMetadata;