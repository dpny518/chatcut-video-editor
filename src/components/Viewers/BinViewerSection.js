import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import BinViewer from './BinViewer';
import TranscriptViewer from './TranscriptViewer';

const BinViewerSection = ({ 
  selectedClip, 
  onAddToTimeline,
  transcriptData,
  onTranscriptUpload 
}) => {
  const [viewMode, setViewMode] = useState(0);

  return (
    <Paper 
      sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {/* Single header with view toggle */}
      <Box sx={{ 
        p: 2,
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Typography variant="subtitle1">
          Bin Viewer
        </Typography>
        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{ minHeight: 48 }}
        >
          <Tab
            icon={<VideoFileIcon />}
            iconPosition="start"
            label="Video"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<TextSnippetIcon />}
            iconPosition="start"
            label="Transcript"
            disabled={!transcriptData}
            sx={{ minHeight: 48 }}
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
          <BinViewer
            selectedClip={selectedClip}
            onAddToTimeline={onAddToTimeline}
          />
        ) : (
          <TranscriptViewer
            selectedClip={selectedClip}
            transcriptData={transcriptData}
            onAddToTimeline={onAddToTimeline}
          />
        )}
      </Box>
    </Paper>
  );
};

export default BinViewerSection;