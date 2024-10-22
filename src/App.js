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

// Controls
import ExportControls from './components/Controls/ExportControls';


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

  const handleExportVideo = () => {
    console.log('Exporting video with clips:', timelineClips);
  };

  const handleDownloadState = () => {
    const state = {
      mediaFiles,
      selectedBinClip,
      timelineClips
    };
    
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor-state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDebugClips = () => {
    const debugClips = [
      {
        id: 'debug-clip-1',
        name: 'Debug Clip 1',
        startTime: 0,
        endTime: 10,
        duration: 10,
        file: new File([''], 'test1.mp4', { type: 'video/mp4' })
      },
      {
        id: 'debug-clip-2',
        name: 'Debug Clip 2',
        startTime: 12, // Gap of 2 seconds
        endTime: 18,
        duration: 6,
        file: new File([''], 'test2.mp4', { type: 'video/mp4' })
      }
    ];
    setTimelineClips(debugClips);
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
              gap: 2
            }}>
              <TimelineSection
                clips={timelineClips}
                onClipsChange={handleTimelineClipsChange}
              />
              
              <ExportControls
                onExport={handleExportVideo}
                onDownloadState={handleDownloadState}
                onDebugClips={handleDebugClips}
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

