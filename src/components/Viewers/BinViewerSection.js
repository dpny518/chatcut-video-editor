// src/components/Viewers/BinViewerSection.js
import React, { useState } from 'react';
import { 
  Box, 
  Paper,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import TranscriptViewer from './TranscriptViewer';

const BinViewerSection = ({ 
  transcripts,
  onAddToTimeline,
  timelineState,
}) => {
  // Default to transcript view (1)
  const [viewMode, setViewMode] = useState(1);

  return (
    <Paper 
      sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden'
      }}
    >
      {/* Tabs header */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              color: 'text.secondary',
            }
          }}
        >
          <Tab
            icon={<PlayCircleOutlineIcon />}
            iconPosition="start"
            label="VIDEO"
            disabled
            sx={{
              opacity: 0.5,
              '&.Mui-disabled': {
                color: 'text.disabled',
              }
            }}
          />
          <Tab
            icon={<TextSnippetIcon />}
            iconPosition="start"
            label="TRANSCRIPT"
          />
        </Tabs>
      </Box>

      {/* Content area */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {viewMode === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Video viewer coming soon
            </Typography>
          </Box>
        ) : (
          <TranscriptViewer
            transcripts={transcripts}
            onAddToTimeline={onAddToTimeline}
            timelineState={timelineState}
          />
        )}
      </Box>
    </Paper>
  );
};

export default BinViewerSection;
