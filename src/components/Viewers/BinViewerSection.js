import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import BinViewer from './BinViewer';
import TranscriptViewerSection from './TranscriptViewerSection';

const BinViewerSection = ({ 
  clips,
  selectedClips,
  onAddToTimeline,
  transcriptData,
  timelineState,
  onTranscriptUpload,
  masterClipManager,
}) => {
  const [viewMode, setViewMode] = useState(0);
  const [timelineRows, setTimelineRows] = useState([{ rowId: 0, clips: [], lastEnd: 0 }]);
  const [mergeError, setMergeError] = useState(null);

  // Get merged content if multiple clips are selected
  const mergedContent = useMemo(() => {
    if (selectedClips.length > 1) {
      try {
        setMergeError(null);
        const content = masterClipManager.getSelectedContent(
          selectedClips.map(clip => clip.name)
        );
        console.log('Merged content:', content);
        return content;
      } catch (error) {
        console.error('Error merging content:', error);
        setMergeError(error.message);
        return null;
      }
    }
    return null;
  }, [selectedClips, masterClipManager]);

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
      <Box sx={{ 
        p: 2,
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Typography variant="h6">
          {selectedClips.length > 1 
            ? `Merged View (${selectedClips.length} clips)`
            : 'Bin Viewer'
          }
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
            disabled={!transcriptData && !mergedContent?.mergedTranscript}
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {mergeError && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          Error merging content: {mergeError}
        </Alert>
      )}

      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {selectedClips.length > 0 && (
          viewMode === 0 ? (
            <BinViewer
              clips={clips}
              selectedClip={selectedClips[0]}
              mergedContent={mergedContent}
              onAddToTimeline={handleAddToTimeline}
              masterClipManager={masterClipManager}
              timelineRows={timelineRows}
              setTimelineRows={setTimelineRows}
            />
          ) : (
            <TranscriptViewerSection
              clips={clips}
              selectedClips={selectedClips}
              transcriptData={transcriptData}
              mergedContent={mergedContent}
              onAddToTimeline={handleAddToTimeline}
              masterClipManager={masterClipManager}
            />
          )
        )}
      </Box>
    </Paper>
  );
};

export default BinViewerSection;