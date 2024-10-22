import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Layout components
import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';

// Viewer components
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';

// Timeline components
import TimelineSection from './components/Timeline/TimelineSection';
import TimelineDebug from './components/Timeline/TimelineDebug';



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
                  marginBottom: '20px', // Ensure space at the bottom
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
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;

