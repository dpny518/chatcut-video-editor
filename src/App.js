import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';

// Layout components
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';

// Chabot
import ChatBot from './components/Chatbot/ChatBot';

// Viewer components
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';

// Timeline components
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';
import { useTimelineStateManager } from './hooks/useTimeline/useTimelineStateManager';




const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0ea5e9' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  // State
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedBinClips, setSelectedBinClips] = useState([]);
  const [timelineClips, setTimelineClips] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedTimelineProject, setSelectedTimelineProject] = useState(null);
  const [transcripts, setTranscripts] = useState(new Map());

  const [chatMessages, setChatMessages] = useState([]);
  const [timelineRows, setTimelineRows] = useState([{ rowId: 0, clips: [], lastEnd: 0 }]);

 

// Add this handler function:
const handleChatMessage = (message) => {
  setChatMessages(prev => [...prev, message]);
};

  // Timeline metadata state
  const [timelineMetadata, setTimelineMetadata] = useState({
    scale: 1,
    selectedClipId: null
  });

  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  const timelineState = {
    clips: timelineClips.map(clip => {
      const metadata = clip.metadata || {};
      const playback = metadata.playback || {};
      const timeline = metadata.timeline || {};
  
      return {
        ...clip,
        timelinePosition: {
          start: timeline.start,
          end: timeline.end,
          duration: timeline.duration,
          track: timeline.track || 0,
          playbackStart: playback.start,
          playbackEnd: playback.end,
          playbackDuration: playback.duration
        }
      };
    }),
    totalDuration: timelineClips.reduce((max, clip) => {
      const end = clip.metadata?.timeline?.end || 0;
      return Math.max(max, end);
    }, 0),
    settings: { 
      scale: timelineMetadata.scale, 
      selectedClipId: timelineMetadata.selectedClipId 
    }
  };
  

  // File handling
  const handleFileUpload = async (file) => {
    try {
      if (file.type.startsWith('video/')) {
        // Handle video file
        const newFile = { 
          id: Date.now().toString(), 
          file: file, 
          name: file.name,
          type: file.type,
          size: file.size 
        };
        setMediaFiles(prevFiles => [...prevFiles, newFile]);
  
        // Automatically look for matching transcript
        const transcriptName = file.name.replace(/\.[^/.]+$/, '.json');
        const hasTranscript = transcripts.has(transcriptName);
        if (hasTranscript) {
          showNotification(`Found matching transcript for ${file.name}`, 'success');
        }
      } 
      else if (file.name.endsWith('.json')) {
        // Handle transcript file
        try {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
  
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
  
          // Get the corresponding video name
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = mediaFiles.some(f => f.name === videoName);
  
          setTranscripts(prev => new Map(prev).set(file.name, transcriptData));
          
          if (hasVideo) {
            showNotification(`Transcript loaded for ${videoName}`, 'success');
          } else {
            showNotification('Transcript loaded. Upload matching video file to use it.', 'info');
          }
        } catch (error) {
          showNotification(`Invalid transcript file: ${error.message}`, 'error');
        }
      }
    } catch (error) {
      showNotification(`Error uploading file: ${error.message}`, 'error');
    }
  };

  const handleFileSelect = (selectedFiles) => {  // Changed to handle array
    setSelectedBinClips(selectedFiles);
  };

  const handleAddToTimeline = (clipData) => {
    const transcriptName = clipData.name.replace(/\.[^/.]+$/, '.json');
    const transcriptData = transcripts.get(transcriptName);

    console.log("App.js handleAddToTimeline called with clipData:", clipData);

    // Directly use the existing timeline metadata
    const enrichedClip = {
        ...clipData,
        transcript: transcriptData || null,
        metadata: {
            ...clipData.metadata,
            timeline: {
                ...clipData.metadata.timeline,
                track: 0 // Still placing all clips on track 0 for now
            }
        }
    };

    // Add enriched clip to timelineClips state
    setTimelineClips((prevClips) => [...prevClips, enrichedClip]);
};

  const handleTimelineClipsChange = (newClips) => {
    setTimelineClips(newClips);
  };

  // Timeline Project Management
  const { saveTimelineProject, loadTimelineProject, deleteTimelineProject } = useTimelineStateManager({
    timelineClips,
    timelineMetadata,
    mediaFiles,
    selectedClipId: timelineMetadata.selectedClipId,
    setTimelineClips,
    setTimelineMetadata,
    showNotification
  });

  // Project management handlers
  const handleTimelineProjectSave = useCallback((projectName) => {
    const success = saveTimelineProject(projectName);
    if (success) {
      setSelectedTimelineProject(projectName);
    }
  }, [saveTimelineProject]);

  const handleTimelineProjectLoad = useCallback((projectName) => {
    const success = loadTimelineProject(projectName);
    if (success) {
      setSelectedTimelineProject(projectName);
    }
  }, [loadTimelineProject]);

  const handleTimelineProjectDelete = useCallback((projectName) => {
    const success = deleteTimelineProject(projectName);
    if (success && selectedTimelineProject === projectName) {
      setSelectedTimelineProject(null);
    }
  }, [deleteTimelineProject, selectedTimelineProject]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainLayout
          mediaFiles={mediaFiles}
          selectedFiles={selectedBinClips}
          onFileUpload={handleFileUpload}
          onFileSelect={handleFileSelect}
          timelineProjects={{
            selected: selectedTimelineProject,
            onSave: handleTimelineProjectSave,
            onLoad: handleTimelineProjectLoad,
            onDelete: handleTimelineProjectDelete
          }}
        >
          <EditorLayout>
            {/* Main Content Area */}
            <Box sx={{ display: 'flex', gap: 2, p: 2, pb: 0 }}>
            <BinViewerSection
              clips={timelineClips}
              selectedClips={selectedBinClips}
              onAddToTimeline={handleAddToTimeline}
              transcriptData={
                selectedBinClips.map(clip => ({
                  clipId: clip.id,
                  transcript: transcripts.get(clip.name.replace(/\.[^/.]+$/, '.json'))
                }))
              }
              timelineState={timelineState}
              setTimelineRows={setTimelineRows}
            />
              <TimelineViewerSection 
                clips={timelineClips}
                transcript={transcripts}
                timelineState={timelineState} 
              />
            </Box>

            {/* Timeline and Controls Area */}
            <Box sx={{ 
              mt: 2, 
              px: 2, 
              pb: 2, 
              bgcolor: 'background.default', 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '& > *:last-child': {
                marginBottom: '20px',
              }
            }}>
              <TimelineSection
             clips={timelineClips}
             onClipsChange={handleTimelineClipsChange}
             timelineState={timelineState}
             timelineRows={timelineRows}
             setTimelineRows={setTimelineRows}
                />
           <TimelineDebug
              timelineClips={timelineClips}
              selectedBinClip={selectedBinClips.length === 1 ? selectedBinClips[0] : null}  // Pass single clip if one is selected
            />
            </Box>
          </EditorLayout>
          <ChatBot 
          clips={timelineClips}
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          selectedClips={selectedBinClips}
          transcriptData={
            selectedBinClips.length === 1 
              ? transcripts.get(selectedBinClips[0].name.replace(/\.[^/.]+$/, '.json')) 
              : null
          }
          onAddToTimeline={handleAddToTimeline}
          timelineState={timelineState}
          timelineRows={timelineRows}
          setTimelineRows={setTimelineRows}
          onClipsChange={handleTimelineClipsChange}
          />
        </MainLayout>

        {/* Notifications */}
        <Snackbar
          open={!!notification}
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
        >
          <Alert
            onClose={() => setNotification(null)}
            severity={notification?.severity}
            sx={{ width: '100%' }}
          >
            {notification?.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;



