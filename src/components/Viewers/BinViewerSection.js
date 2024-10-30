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
import BinViewer from './BinViewer';import TranscriptViewer from './TranscriptViewer';


const BinViewerSection = ({ 
  clips,
  selectedClip, 
  onAddToTimeline,
  transcriptData,
  timelineState,
  onTranscriptUpload,
}) => {
  const [viewMode, setViewMode] = useState(0);
  const [timelineRows, setTimelineRows] = useState([{ rowId: 3, clips: [], lastEnd: 0 }]);

  // Modified add to timeline handler to update timelineRows
  const handleAddToTimeline = (clipData) => {
    // Call the parent's onAddToTimeline
    onAddToTimeline?.(clipData);
    
    // Update local timelineRows state if needed
    setTimelineRows(prev => {
      const rowIndex = clipData.metadata.timeline.row;
      const updated = [...prev];
      while (updated.length <= rowIndex) {
        updated.push({ rowId: updated.length, clips: [], lastEnd: 0 });
      }
      const targetRow = updated[rowIndex];
      targetRow.clips.push(clipData);
      targetRow.lastEnd = Math.max(targetRow.lastEnd, clipData.metadata.timeline.end);
      return updated;
    });
  };

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
            clips={clips}
            selectedClip={selectedClip}
            onAddToTimeline={handleAddToTimeline}
            timelineRows={timelineRows}
            setTimelineRows={setTimelineRows}
          />
        ) : (
          <TranscriptViewer
            clips={clips}
            selectedClip={selectedClip}
            transcriptData={transcriptData}
            onAddToTimeline={handleAddToTimeline}
            timelineRows={timelineRows}
            setTimelineRows={setTimelineRows}
          />
        )}
      </Box>
    </Paper>
  );
};

export default BinViewerSection;