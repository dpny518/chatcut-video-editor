import React from 'react';
import { Box, Button } from '@mui/material';

const TranscriptToolbar = ({ onAction }) => {
  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Button variant="contained" onClick={() => onAction('someAction')}>
        Toolbar Action
      </Button>
    </Box>
  );
};

export default TranscriptToolbar; 