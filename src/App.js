import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert, Typography, TextField, Button } from '@mui/material';
import { Upload, Clock } from 'lucide-react';

// Layout components
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';

// Viewer components
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';

// Timeline components
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';
import TimelineList from './components/Timeline/TimelineManager/TimelineList';
import TimelineActions from './components/Timeline/TimelineManager/TimelineActions';

// Hooks
import { useTimelineManager } from './hooks/useTimeline/useTimelineManager';
import { useTimelineReferences } from './hooks/useTimeline/useTimelineReferences';
import { useTimelineValidation } from './hooks/useTimeline/useTimelineValidation';

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

const EmptyState = () => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 4,
      bgcolor: 'background.paper',
      borderRadius: 1,
      border: '2px dashed',
      borderColor: 'divider'
    }}
  >
    <Upload size={48} />
    <Typography variant="h6" color="text.primary">
      Start Your Project
    </Typography>
    <Typography variant="body2" color="text.secondary" textAlign="center">
      Upload your media files to the bin first.<br />
      Then you can create timelines and start editing.
    </Typography>
  </Box>
);

const CreateTimelinePrompt = ({ onCreateTimeline }) => {
  const [name, setName] = useState('');

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        color: 'text.secondary',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Clock size={32} />
      <Typography variant="h6">Create Your First Timeline</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create a timeline to start arranging your clips
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Timeline Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={() => {
            if (name.trim()) {
              onCreateTimeline(name);
              setName('');
            }
          }}
          disabled={!name.trim()}
        >
          Create Timeline
        </Button>
      </Box>
    </Box>
  );
};

const TimelineSelectionPrompt = () => (
  <Box sx={{ 
    p: 4, 
    textAlign: 'center', 
    color: 'text.secondary',
    bgcolor: 'background.paper',
    borderRadius: 1 
  }}>
    <Typography>Select a timeline from the list above to begin editing</Typography>
  </Box>
);

const UploadPrompt = () => (
  <Box
    sx={{
      p: 4,
      textAlign: 'center',
      color: 'text.secondary',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}
  >
    <Upload size={32} />
    <Typography>
      Start by uploading media files to your bin
    </Typography>
    <Typography variant="caption">
      Supported formats: MP4, WebM, MOV
    </Typography>
  </Box>
);

function App() {
  // Media bin state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  
  // Notification state
  const [notification, setNotification] = useState(null);

  // Initialize timeline management hooks
  const {
    timelines,
    activeTimelineId,
    setActiveTimelineId,
    createTimeline,
    deleteTimeline,
    addClipToTimeline,
    moveClipBetweenTimelines
  } = useTimelineManager();

  // Initialize reference management
  const {
    createReference,
    updateReference,
    validateReference,
    getTimelineReferences
  } = useTimelineReferences();

  // Initialize validation
  const validation = useTimelineValidation(timelines, getTimelineReferences());

  // Notification helper
  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  // Media handlers
  const handleFileUpload = (file) => {
    const newFile = { 
      id: `bin-${Date.now()}`, 
      file, 
      name: file.name,
      type: file.type,
      size: file.size 
    };
    setMediaFiles(prev => [...prev, newFile]);
  };

  const handleFileSelect = (selectedFile) => {
    setSelectedBinClip(selectedFile);
  };

  // Timeline handlers
  const handleAddToTimeline = useCallback((clipData) => {
    if (!activeTimelineId) {
      showNotification('No timeline selected', 'warning');
      return;
    }

    try {
      const validationResult = validation.validateClipAddition({
        sourceType: 'bin',
        sourceId: clipData.file.id,
        targetTimelineId: activeTimelineId,
        clipData
      });

      if (!validationResult.valid) {
        throw new Error(validationResult.errors[0].message);
      }

      const result = addClipToTimeline({
        sourceType: 'bin',
        sourceId: clipData.file.id,
        targetTimelineId: activeTimelineId,
        clipData
      });

      if (result.success) {
        showNotification('Clip added to timeline', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [activeTimelineId, addClipToTimeline, validation]);

  // Timeline management handlers
  const handleCreateTimeline = useCallback((name) => {
    try {
      const newTimeline = {
        id: `timeline-${Date.now()}`,
        name: name.trim(),
        clips: [],
        settings: {
          snapToGrid: true,
          autoScroll: true
        },
        metadata: {
          timeline: {
            start: 0,
            end: 300,
            duration: 300
          }
        }
      };
  
      const timelineId = createTimeline(newTimeline);
      setActiveTimelineId(timelineId);
      showNotification(`Timeline "${name}" created`, 'success');
      return timelineId;
    } catch (error) {
      console.error('Error creating timeline:', error);
      showNotification(error.message, 'error');
      return null;
    }
  }, [createTimeline, setActiveTimelineId]);
  
  const handleDeleteTimeline = useCallback((timelineId) => {
    try {
      const validationResult = validation.validateTimelineDeletion(timelineId);
      if (!validationResult.valid) {
        throw new Error(validationResult.errors[0].message);
      }

      deleteTimeline(timelineId);
      showNotification('Timeline deleted', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [deleteTimeline, validation]);

  const handleDuplicateTimeline = useCallback((sourceId, newName) => {
    try {
      const sourceTimeline = timelines[sourceId];
      if (!sourceTimeline) throw new Error('Source timeline not found');

      const newTimelineId = createTimeline(newName);

      sourceTimeline.clips.forEach(clip => {
        addClipToTimeline({
          sourceType: clip.source.type,
          sourceId: clip.source.id,
          targetTimelineId: newTimelineId,
          clipData: clip
        });
      });

      showNotification(`Timeline "${newName}" created`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }, [timelines, createTimeline, addClipToTimeline]);

  // Reference handlers
  const handleCreateReference = useCallback((sourceTimelineId, clipId, targetTimelineId) => {
    try {
      const validationResult = validateReference({
        sourceTimelineId,
        targetTimelineId
      });

      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      const reference = createReference({
        sourceType: 'timeline',
        sourceId: sourceTimelineId,
        sourceClipId: clipId,
        targetTimelineId
      });

      showNotification('Reference created', 'success');
      return reference;
    } catch (error) {
      showNotification(error.message, 'error');
      return null;
    }
  }, [createReference, validateReference]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainLayout
          mediaFiles={mediaFiles}
          selectedBinClip={selectedBinClip}
          onFileUpload={handleFileUpload}
          onFileSelect={handleFileSelect}
        >
          <EditorLayout>
            {/* Timeline Management - Show only after media is uploaded */}
            {mediaFiles.length > 0 && (
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimelineActions
                    onCreateTimeline={handleCreateTimeline}
                    onDeleteTimeline={handleDeleteTimeline}
                    onDuplicateTimeline={handleDuplicateTimeline}
                    currentTimeline={timelines[activeTimelineId]}
                  />
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <TimelineList
                      timelines={Object.values(timelines)}
                      activeId={activeTimelineId}
                      onSelect={setActiveTimelineId}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, p: 2, pb: 0 }}>
              <BinViewerSection
                selectedClip={selectedBinClip}
                onAddToTimeline={handleAddToTimeline}
                mediaFiles={mediaFiles}
              />
              {mediaFiles.length > 0 ? (
                <TimelineViewerSection 
                  timeline={timelines[activeTimelineId]}
                  references={getTimelineReferences(activeTimelineId)}
                />
              ) : (
                <EmptyState />
              )}
            </Box>

            {/* Timeline Area */}
            <Box sx={{ 
              mt: 2, 
              px: 2, 
              pb: 2, 
              bgcolor: 'background.default', 
              borderTop: 1, 
              borderColor: 'divider'
            }}>
              {mediaFiles.length > 0 ? (
                Object.keys(timelines).length > 0 ? (
                  activeTimelineId ? (
                    <TimelineSection
                      timeline={timelines[activeTimelineId]}
                      onClipAdd={handleAddToTimeline}
                      onCreateReference={handleCreateReference}
                      references={getTimelineReferences(activeTimelineId)}
                    />
                  ) : (
                    <TimelineSelectionPrompt />
                  )
                ) : (
                  <CreateTimelinePrompt onCreateTimeline={handleCreateTimeline} />
                )
              ) : (
                <UploadPrompt />
              )}
            </Box>
          </EditorLayout>
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