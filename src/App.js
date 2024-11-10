import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';
import { MasterClipManager } from './services/masterClip/MasterClipManager';


// Layout components
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';

// Chatbot
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
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [timelineClips, setTimelineClips] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedTimelineProject, setSelectedTimelineProject] = useState(null);
  const [transcripts, setTranscripts] = useState(new Map());
  const [chatMessages, setChatMessages] = useState([]);
  const [timelineRows, setTimelineRows] = useState([{ rowId: 0, clips: [], lastEnd: 0 }]);
  const [selectedClips, setSelectedClips] = useState([]);

  // Initialize MasterClipManager
  const masterClipManager = useMemo(() => new MasterClipManager(), []);

  // Timeline metadata state
  const [timelineMetadata, setTimelineMetadata] = useState({
    scale: 1,
    selectedClipId: null
  });

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
  
  // Cleanup effect for MasterClipManager
  useEffect(() => {
    return () => {
      masterClipManager.cleanup?.();
    };
  }, [masterClipManager]);

  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  const handleChatMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
  };

  // File handling
  const handleFileUpload = async (file) => {
    try {
      if (file.type.startsWith('video/')) {
        const newFile = { 
          id: Date.now().toString(), 
          file: file, 
          name: file.name,
          type: file.type,
          size: file.size 
        };
        setMediaFiles(prevFiles => [...prevFiles, newFile]);

        // Add to master manager
        masterClipManager.addVideo(file, newFile);
  
        const transcriptName = file.name.replace(/\.[^/.]+$/, '.json');
        const hasTranscript = masterClipManager.hasTranscript(transcriptName);
        
        if (hasTranscript) {
          showNotification(`Found matching transcript for ${file.name}`, 'success');
        }
      } 
      else if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
  
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
  
          // Add to both transcript stores
          setTranscripts(prev => new Map(prev).set(file.name, transcriptData));
          masterClipManager.addTranscript(file.name, transcriptData);
          
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = masterClipManager.hasVideo(videoName);
  
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

  const handleFileSelect = useCallback((selectedFile) => {
    console.log('File selection:', selectedFile);
    // Ensure we're always working with arrays
    const fileArray = Array.isArray(selectedFile) ? selectedFile : [selectedFile];
    const filteredArray = fileArray.filter(Boolean);
    console.log('Setting selected clips:', filteredArray);
    setSelectedClips(filteredArray);
  }, []);
  

  const handleAddToTimeline = useCallback((clipData) => {
    console.log("App.js handleAddToTimeline called with clipData:", clipData);
  
    try {
      const enrichedClip = masterClipManager.createTimelineClip(clipData);
  
      if (enrichedClip) {
        setTimelineClips(prevClips => [...prevClips, enrichedClip]);
        showNotification('Clip added to timeline', 'success');
      } else {
        showNotification('Failed to create timeline clip', 'error');
      }
    } catch (error) {
      console.error('Error creating timeline clip:', error);
      showNotification(`Error creating clip: ${error.message}`, 'error');
    }
  }, [masterClipManager]);

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
          selectedFiles={selectedClips} // Changed from selectedBinClips
          onFileUpload={handleFileUpload}
          onFileSelect={handleFileSelect}
          timelineProjects={{
            selected: selectedTimelineProject,
            onSave: handleTimelineProjectSave,
            onLoad: handleTimelineProjectLoad,
            onDelete: handleTimelineProjectDelete
          }}
          masterClipManager={masterClipManager}
        >
          <EditorLayout>
            {/* Main Content Area */}
            <Box sx={{ display: 'flex', gap: 2, p: 2, pb: 0 }}>
            <BinViewerSection
              clips={timelineClips}
              selectedClips={selectedClips}
              onAddToTimeline={handleAddToTimeline}
              transcriptData={selectedClips.length === 1 ? 
                  masterClipManager.getTranscriptForClip(selectedClips[0].name) : null}
              mergedContent={selectedClips.length > 1 ? (() => {
                  console.log('Getting merged content for clips:', selectedClips);
                  return masterClipManager.getSelectedContent(
                      selectedClips.map(clip => clip.name)
                  );
              })() : null}
              masterClipManager={masterClipManager}
          />
              <TimelineViewerSection 
                clips={timelineClips}
                transcript={transcripts}
                timelineState={timelineState} 
                masterClipManager={masterClipManager}
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
                masterClipManager={masterClipManager}
              />
<TimelineDebug
  timelineClips={timelineClips}
  selectedClips={selectedClips} // Changed from selectedBinClip
  masterClipManager={masterClipManager}
/>
            </Box>
          </EditorLayout>
          <ChatBot 
          clips={timelineClips}
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          selectedClips={selectedClips} // Changed from selectedBinClip
          transcriptData={selectedClips[0] ? 
            masterClipManager.getTranscriptForClip(selectedClips[0].name) : null}
          transcriptState={selectedClips[0] ? 
            masterClipManager.getTranscriptState(selectedClips[0].name) : null}
          onAddToTimeline={handleAddToTimeline}
          timelineState={timelineState}
          timelineRows={timelineRows}
          setTimelineRows={setTimelineRows}
          onClipsChange={handleTimelineClipsChange}
          masterClipManager={masterClipManager}
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