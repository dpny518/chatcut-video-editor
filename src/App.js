import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import MediaSidebar from './components/MediaSidebar';
import BinViewer from './components/BinViewer';
import TimelineViewer from './components/TimelineViewer';
import Timeline from './components/Timeline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0ea5e9',
    },
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

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <MediaSidebar 
            files={mediaFiles}
            onFileUpload={handleFileUpload}
            onFileSelect={handleFileSelect}
            selectedFile={selectedBinClip}
          />
          
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.default'
          }}>
            {/* Main Content Area */}
            <Box sx={{ 
              display: 'flex',
              flexGrow: 1,
              gap: 2,
              p: 2,
              pb: 0
            }}>
              <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
                <BinViewer
                  selectedClip={selectedBinClip}
                  onAddToTimeline={handleAddToTimeline}
                />
              </Paper>
              <Paper sx={{ flex: 1, p: 2, bgcolor: 'background.paper' }}>
                <TimelineViewer clips={timelineClips} />
              </Paper>
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
              <Box sx={{ 
                width: '100%',
                height: '150px',
                bgcolor: '#1a1a1a',
                mb: 2,
                '.timeline-editor': {
                  width: '100% !important'
                }
              }}>
                <Timeline 
                  clips={timelineClips}
                  onClipsChange={handleTimelineClipsChange}
                />
              </Box>
              <Button 
                variant="contained"
                onClick={handleExportVideo}
                sx={{
                  bgcolor: '#0ea5e9',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#0284c7'
                  },
                  textTransform: 'uppercase',
                  fontWeight: 'medium',
                  px: 3
                }}
              >
                Export Video
              </Button>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;