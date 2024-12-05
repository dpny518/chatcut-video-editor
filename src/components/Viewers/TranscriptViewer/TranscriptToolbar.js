import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon, InsertComment as InsertIcon } from '@mui/icons-material';

const TranscriptToolbar = ({ isSelectionActive, onAddToTimeline, onAddToPapercut, onInsertToPapercut }) => {
  return (
    <Box sx={{ 
      p: 2, 
      borderTop: 1, 
      borderColor: 'divider',
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
    }}>
      <Button
        variant="contained"
        onClick={onAddToTimeline}
        startIcon={<AddIcon />}
        disabled={!isSelectionActive}
      >
        Add to Timeline
      </Button>
      <Button
        variant="contained"
        onClick={onAddToPapercut}
        startIcon={<AddIcon />}
        color="secondary"
        disabled={!isSelectionActive}
      >
        Add to Papercut
      </Button>
      <Button
        variant="contained"
        onClick={onInsertToPapercut}
        startIcon={<InsertIcon />}
        color="primary"
        disabled={!isSelectionActive}
      >
        Insert to Papercut
      </Button>
    </Box>
  );
};

export default TranscriptToolbar;