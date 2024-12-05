import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon, InsertComment as InsertIcon } from '@mui/icons-material';

const TranscriptToolbar = ({ selectedCount, onAddToTimeline, onAddToPapercut, onInsertToPapercut }) => {
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
        disabled={selectedCount === 0}
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
        Add to Papercut {selectedCount > 0 && `(${selectedCount})`}
      </Button>
      <Button
        variant="contained"
        onClick={onInsertToPapercut}
        startIcon={<InsertIcon />}
        color="primary"
        disabled={selectedCount === 0}
      >
        Insert to Papercut {selectedCount > 0 && `(${selectedCount})`}
      </Button>
    </Box>
  );
};

export default TranscriptToolbar;