import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';

// Layout components
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';

// Viewer components
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';

// Timeline components
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';
import TimelineManager from './components/Timeline/TimelineManager';

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
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [timelineClips, setTimelineClips] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedTimelineProject, setSelectedTimelineProject] = useState(null);


  // Timeline metadata state
  const [timelineMetadata, setTimelineMetadata] = useState({
    scale: 1,
    selectedClipId: null
  });

  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  const handleFileUpload = (file) => {
    const newFile = { 
      id: Date.now().toString(), 
      file: file, 
      name: file.name,
      type: file.type,
      size: file.size 
    };
    setMediaFiles(prevFiles => [...prevFiles, newFile]);
  };

  const handleFileSelect = (selectedFile) => {
    setSelectedBinClip(selectedFile);
  };

  const handleAddToTimeline = (clip) => {
    const newClip = {
      id: `clip${timelineClips.length + 1}`,
      file: clip.file,
      name: clip.file.name,
      startTime: clip.startTime || 0,
      endTime: clip.endTime || 0,
      duration: (clip.endTime || 0) - (clip.startTime || 0)
    };
    setTimelineClips(prevClips => [...prevClips, newClip]);
  };

  const handleTimelineClipsChange = (newClips) => {
    setTimelineClips(newClips);
  };

  // Timeline Project Management
  const handleTimelineProjectSave = useCallback((projectName) => {
    const timelineProject = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      name: projectName,
      timeline: {
        clips: timelineClips.map(clip => ({
          id: clip.id,
          type: "video",
          source: {
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            file: {
              name: clip.file.name,
              size: clip.file.size,
              type: clip.file.type
            }
          },
          timeline: {
            startTime: clip.metadata?.timeline?.start || 0,
            endTime: clip.metadata?.timeline?.end || clip.duration,
            track: clip.metadata?.timeline?.track || 0
          },
          enabled: true
        })),
        duration: timelineClips.reduce((max, clip) => {
          const endTime = clip.metadata?.timeline?.end || clip.duration;
          return Math.max(max, endTime);
        }, 0),
        settings: {
          scale: 0.5 // Or whatever your current timeline scale is
        }
      }
    };

    try {
      // Get existing projects
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      
      // Add/Update project
      savedProjects[projectName] = {
        ...timelineProject,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('timelineProjects', JSON.stringify(savedProjects));
      setSelectedTimelineProject(projectName);
      showNotification(`Timeline project "${projectName}" saved successfully`, 'success');
    } catch (error) {
      console.error('Failed to save timeline project:', error);
      showNotification('Failed to save timeline project', 'error');
    }
  }, [timelineClips]);

  const handleTimelineProjectLoad = useCallback((projectName) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      const project = savedProjects[projectName];
      
      if (!project) {
        throw new Error(`Timeline project "${projectName}" not found`);
      }

      // Validate all required media files are available
      const missingFiles = project.timeline.clips.filter(clip => 
        !mediaFiles.find(f => f.name === clip.source.file.name)
      );

      if (missingFiles.length > 0) {
        throw new Error(
          `Missing media files: ${missingFiles.map(f => f.source.file.name).join(', ')}`
        );
      }

      // Convert project clips back to app format
      const loadedClips = project.timeline.clips.map(clip => {
        const mediaFile = mediaFiles.find(f => f.name === clip.source.file.name);
        
        return {
          id: clip.id,
          file: mediaFile.file,
          startTime: clip.source.startTime,
          endTime: clip.source.endTime,
          duration: clip.source.duration,
          metadata: {
            timeline: {
              start: clip.timeline.startTime,
              end: clip.timeline.endTime,
              track: clip.timeline.track
            }
          }
        };
      });

      setTimelineClips(loadedClips);
      setSelectedTimelineProject(projectName);
      showNotification(`Timeline project "${projectName}" loaded successfully`, 'success');
    } catch (error) {
      console.error('Failed to load timeline project:', error);
      showNotification(error.message, 'error');
    }
  }, [mediaFiles]);

  const handleDeleteTimelineProject = useCallback((projectName) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('timelineProjects') || '{}');
      delete savedProjects[projectName];
      localStorage.setItem('timelineProjects', JSON.stringify(savedProjects));
      
      if (selectedTimelineProject === projectName) {
        setSelectedTimelineProject(null);
      }
      
      showNotification(`Timeline project "${projectName}" deleted`, 'success');
    } catch (error) {
      console.error('Failed to delete timeline project:', error);
      showNotification('Failed to delete timeline project', 'error');
    }
  }, [selectedTimelineProject]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainLayout
          mediaFiles={mediaFiles}
          selectedBinClip={selectedBinClip}
          onFileUpload={handleFileUpload}
          onFileSelect={handleFileSelect}
          timelineProjects={{
            selected: selectedTimelineProject,
            onSave: handleTimelineProjectSave,
            onLoad: handleTimelineProjectLoad,
            onDelete: handleDeleteTimelineProject
          }}
        >
          <EditorLayout>
            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, p: 2, pb: 0 }}>
              <BinViewerSection
                selectedClip={selectedBinClip}
                onAddToTimeline={handleAddToTimeline}
              />
              <TimelineViewerSection clips={timelineClips} />
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
              />
              <TimelineDebug
                timelineClips={timelineClips}
                selectedBinClip={selectedBinClip}
              />
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