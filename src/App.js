import React, { useCallback, useMemo } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert, Typography, CircularProgress } from '@mui/material';
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';
import useEditorStore from './stores/editorStore';
import { shallow } from 'zustand/shallow';

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

// Separate selector functions
const selectInitState = (state) => ({
  isInitialized: state.isInitialized,
  loading: state.loading
});

const selectFileState = (state) => ({
  mediaFiles: state.mediaFiles,
  selectedBinClip: state.selectedBinClip
});

const selectTimelineState = (state) => ({
  timelineClips: state.timelineClips,
  selectedTimelineProject: state.selectedTimelineProject,
});

const selectTranscripts = (state) => state.transcripts;
const selectNotification = (state) => state.notification;

// Add actions selector
const selectActions = (state) => ({
  addMediaFile: state.addMediaFile,
  addTranscript: state.addTranscript,
  setSelectedBinClip: state.setSelectedBinClip,
  setNotification: state.setNotification,
  addToTimeline: state.addToTimeline,
  updateTimelineClips: state.updateTimelineClips,
  saveTimelineProject: state.saveTimelineProject,
  loadTimelineProject: state.loadTimelineProject,
  deleteTimelineProject: state.deleteTimelineProject,
  hasMatchingTranscript: state.hasMatchingTranscript,
  getTranscriptForFile: state.getTranscriptForFile
});

// Separate NotificationAlert into its own component
const NotificationAlert = React.memo(({ notification, onClose }) => {
  if (!notification) return null;
  
  return (
    <Snackbar
      open={true}
      autoHideDuration={3000}
      onClose={onClose}
    >
      <Alert
        onClose={onClose}
        severity={notification.severity}
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
});

// Loading component
const LoadingScreen = React.memo(() => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      gap: 2
    }}
  >
    <CircularProgress />
    <Typography variant="h6" color="text.secondary">
      Loading editor...
    </Typography>
  </Box>
));

const App = () => {

  const { isInitialized, loading } = useEditorStore(selectInitState, shallow);
  const fileState = useEditorStore(selectFileState, shallow);
  const timelineState = useEditorStore(selectTimelineState, shallow);
  const transcripts = useEditorStore(selectTranscripts);
  const notification = useEditorStore(selectNotification);
  const actions = useEditorStore(selectActions, shallow);

  const timelineSectionStyle = useMemo(() => ({ 
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
  }), []);

  const handleFileUpload = useCallback(async (file) => {
    try {
      if (file.type.startsWith('video/')) {
        await actions.addMediaFile(file);
        
        if (actions.hasMatchingTranscript(file.name)) {
          actions.setNotification(`Found matching transcript for ${file.name}`, 'success');
        }
      } 
      else if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
          
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
          
          await actions.addTranscript(file.name, transcriptData);
          
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = fileState.mediaFiles.some(f => f.name === videoName);
          
          actions.setNotification(
            hasVideo 
              ? `Transcript loaded for ${videoName}` 
              : 'Transcript loaded. Upload matching video file to use it.',
            'success'
          );
        } catch (error) {
          console.error('Error processing transcript:', error);
          actions.setNotification('Invalid transcript file format', 'error');
        }
      }
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      actions.setNotification(`Error uploading file: ${error.message}`, 'error');
    }
  }, [actions, fileState.mediaFiles]);

  const handleTimelineProjectSave = useCallback((name) => {
    actions.saveTimelineProject(name);
    actions.setNotification(`Timeline "${name}" saved successfully`, 'success');
  }, [actions]);

  const timelineProjectProps = useMemo(() => ({
    selected: timelineState.selectedTimelineProject,
    onSave: handleTimelineProjectSave,
    onLoad: actions.loadTimelineProject,
    onDelete: actions.deleteTimelineProject
  }), [
    timelineState.selectedTimelineProject,
    handleTimelineProjectSave,
    actions
  ]);

  const timelineSectionProps = useMemo(() => ({
    clips: timelineState.timelineClips,
    onClipsChange: actions.updateTimelineClips,
    transcripts
  }), [timelineState.timelineClips, actions, transcripts]);

  // Early return after all hooks
  if (!isInitialized || loading) {
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100vh',
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography variant="h6" color="text.secondary">
              Loading editor...
            </Typography>
          </Box>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }


  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainLayout
          mediaFiles={fileState.mediaFiles}
          selectedBinClip={fileState.selectedBinClip}
          onFileUpload={handleFileUpload}
          onFileSelect={actions.setSelectedBinClip}
          timelineProjects={timelineProjectProps}
        >
          <EditorLayout>
            <Box sx={{ display: 'flex', gap: 2, p: 2, pb: 0 }}>
              <BinViewerSection
                selectedClip={fileState.selectedBinClip}
                onAddToTimeline={actions.addToTimeline}
                transcriptData={transcripts}
              />
              <TimelineViewerSection 
                clips={timelineState.timelineClips}
              />
            </Box>

            <Box sx={timelineSectionStyle}>
              <TimelineSection {...timelineSectionProps} />
              <TimelineDebug
                timelineClips={timelineState.timelineClips}
                selectedBinClip={fileState.selectedBinClip}
              />
            </Box>
          </EditorLayout>
        </MainLayout>

        <NotificationAlert 
          notification={notification}
          onClose={() => actions.setNotification(null)}
        />
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default React.memo(App);