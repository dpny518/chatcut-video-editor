// src/components/Viewers/TimelineViewerSection.js
import React, { useState } from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { FileVideo, FileText } from 'lucide-react';
import TimelineViewer from './TimelineViewer';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';

const TimelineViewerSection = ({ clips, currentClip, transcript,timelineState }) => {
  const [viewMode, setViewMode] = useState('video');
  
  return (
    <Paper sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ typography: 'subtitle1' }}>Timeline Viewer</Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="video">
            <FileVideo className="w-4 h-4 mr-2" />
            Video
          </ToggleButton>
          <ToggleButton value="transcript">
            <FileText className="w-4 h-4 mr-2" />
            Transcript
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        {viewMode === 'video' ? (
          <TimelineViewer
            clips={clips}
            currentClip={currentClip}
          />
        ) : (
          <TimelineTranscriptViewer
            clips={clips}
            currentClip={currentClip}
            transcriptData={transcript}
            timelineState={timelineState}
          />
        )}
      </Box>
    </Paper>
  );
};
export default TimelineViewerSection;