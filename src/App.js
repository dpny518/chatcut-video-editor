import React, { useCallback } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';

// Components imports...
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';

import useEditorStore from './stores/editorStore';

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

const App = () => {
  const {
    // States
    mediaFiles,
    selectedBinClip,
    timelineClips,
    notification,
    selectedTimelineProject,
    activeTimelineTranscripts,
    timelineMetadata,
    
    // Actions
    addMediaFile,
    addTranscript,
    setSelectedBinClip,
    setNotification,
    addToTimeline,
    updateTimelineClips,
    saveTimelineProject,
    loadTimelineProject,
    deleteTimelineProject,
    hasMatchingTranscript,
    getTranscriptForFile
  } = useEditorStore();

  const handleFileUpload = useCallback(async (file) => {
    try {
      if (file.type.startsWith('video/')) {
        const newFile = await addMediaFile(file);
        
        if (hasMatchingTranscript(file.name)) {
          setNotification(`Found matching transcript for ${file.name}`, 'success');
        }
      } 
      else if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
          
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
          
          await addTranscript(file.name, transcriptData);
          
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = mediaFiles.some(f => f.name === videoName);
          
          setNotification(
            hasVideo 
              ? `Transcript loaded for ${videoName}` 
              : 'Transcript loaded. Upload matching video file to use it.',
            'success'
          );
        } catch (error) {
          console.error('Error processing transcript:', error);
          setNotification('Invalid transcript file format', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setNotification(`Error uploading file: ${error.message}`, 'error');
    }
  }, [addMediaFile, addTranscript, hasMatchingTranscript, mediaFiles, setNotification]);

  const handleTimelineProjectSave = useCallback((name) => {
    saveTimelineProject(name);
    setNotification(`Timeline "${name}" saved successfully`, 'success');
  }, [saveTimelineProject, setNotification]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainLayout
          mediaFiles={mediaFiles}
          selectedBinClip={selectedBinClip}
          onFileUpload={handleFileUpload}
          onFileSelect={setSelectedBinClip}
          timelineProjects={{
            selected: selectedTimelineProject,
            onSave: handleTimelineProjectSave,
            onLoad: loadTimelineProject,
            onDelete: deleteTimelineProject
          }}
        >
          <EditorLayout>
            <Box sx={{ display: 'flex', gap: 2, p: 2, pb: 0 }}>
              <BinViewerSection
                selectedClip={selectedBinClip}
                onAddToTimeline={addToTimeline}
                transcriptData={
                  selectedBinClip 
                    ? getTranscriptForFile(selectedBinClip.name)
                    : null
                }
              />
              <TimelineViewerSection 
                clips={timelineClips}
              />
            </Box>

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
                onClipsChange={updateTimelineClips}
                transcripts={activeTimelineTranscripts}
              />
              <TimelineDebug
                timelineClips={timelineClips}
                selectedBinClip={selectedBinClip}
              />
            </Box>
          </EditorLayout>
        </MainLayout>

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
};

export default App;