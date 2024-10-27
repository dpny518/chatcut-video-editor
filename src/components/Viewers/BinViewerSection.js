import React, { useState, useMemo } from 'react';
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
import TranscriptViewerSection from './TranscriptViewerSection';
import useMediaStore from '../../stores/mediaStore';

const BinViewerSection = () => {
  // Local UI state
  const [viewMode, setViewMode] = useState(0);

  // Get state and actions from store
  const {
    selectedFile,
    getTranscriptForFile,
    addToTimeline
  } = useMediaStore(state => ({
    selectedFile: state.selectedFile,
    getTranscriptForFile: state.getTranscriptForFile,
    addToTimeline: state.addToTimeline
  }));

  // Memoized transcript data
  const transcriptData = useMemo(() => {
    if (!selectedFile?.name) return null;
    return getTranscriptForFile(selectedFile.name);
  }, [selectedFile, getTranscriptForFile]);

  // Handlers
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  return (
    <Paper 
      sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      {/* Header with view toggle */}
      <Box sx={{ 
        p: 2,
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.default'
      }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 500,
          color: 'text.primary'
        }}>
          Bin Viewer
        </Typography>
        <Tabs 
          value={viewMode} 
          onChange={handleViewModeChange}
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none'
            }
          }}
        >
          <Tab
            icon={<VideoFileIcon />}
            iconPosition="start"
            label="Video"
            sx={{ 
              minHeight: 48,
              fontSize: '0.875rem'
            }}
          />
          <Tab
            icon={<TextSnippetIcon />}
            iconPosition="start"
            label="Transcript"
            disabled={!transcriptData}
            sx={{ 
              minHeight: 48,
              fontSize: '0.875rem'
            }}
          />
        </Tabs>
      </Box>

      {/* Content area */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
      }}>
        {viewMode === 0 ? (
          <BinViewer />
        ) : (
          <TranscriptViewerSection
            transcriptData={transcriptData}
            onAddToTimeline={addToTimeline}
          />
        )}
      </Box>
    </Paper>
  );
};

export default BinViewerSection;