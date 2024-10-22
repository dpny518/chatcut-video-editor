// src/components/Timeline/TimelineControls.js
import React from 'react';
import { 
  Stack, 
  Box, 
  Button, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  Download, 
  BugReport 
} from '@mui/icons-material';
const TimelineControls = ({ onExport, onDownloadState, onDebugClips }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button 
        variant="contained"
        onClick={onExport}
        sx={{
          bgcolor: '#0ea5e9',
          color: 'white',
          '&:hover': {
            bgcolor: '#0284c7'
          },
          textTransform: 'uppercase',
          fontWeight: 'medium',
          px: 3
        }}
      >
        Export Video
      </Button>

      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
        <Tooltip title="Download Current State">
          <IconButton 
            onClick={onDownloadState}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load Debug Clips">
          <IconButton 
            onClick={onDebugClips}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <BugReport fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
};

export default TimelineControls;