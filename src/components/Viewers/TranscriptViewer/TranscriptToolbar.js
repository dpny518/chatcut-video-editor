import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const TranscriptToolbar = ({ selectedCount, onAddToTimeline, onAddToPapercut }) => {
  console.log('TranscriptToolbar render, selectedCount:', selectedCount);
  return (
    <Box sx={{ 
      borderTop: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      minHeight: '60px',
      p: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
    }}>
      <Button
        variant="contained"
        onClick={onAddToTimeline}
        startIcon={<AddIcon />}
        disabled={selectedCount === 0}
        sx={{
          bgcolor: 'primary.dark',
          '&:hover': {
            bgcolor: 'primary.main',
          },
        }}
      >
        Add to Timeline {selectedCount > 0 && `(${selectedCount})`}
       </Button>
      <Button
        variant="contained"
        onClick={onAddToPapercut}
        startIcon={<AddIcon />}
        color="secondary"
        disabled={selectedCount === 0}
      >
        Add to Papercut {selectedCount > 0 && `(${selectedCount} words)`}
      </Button>
    </Box>
  );
};


export default TranscriptToolbar;