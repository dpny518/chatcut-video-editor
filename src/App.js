import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MediaLibrary from './components/MediaLibrary';
import BinViewer from './components/BinViewer';
import TimelineViewer from './components/TimelineViewer';
import Timeline from './components/Timeline';
import Export from './components/Export';

const theme = createTheme();

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [selectedTimelineClip, setSelectedTimelineClip] = useState(null);
  const [timelineClips, setTimelineClips] = useState([]);

  const handleVideoUpload = (file) => {
    const newVideo = { id: Date.now(), file: file };
    setVideos(prevVideos => [...prevVideos, newVideo]);
  };

  const handleFileSelect = (selectedVideo) => {
    setSelectedBinClip(selectedVideo);
  };

  const handleAddToTimeline = (clip) => {
    setTimelineClips(prevClips => [...prevClips, clip]);
  };

  const handleTimelineClipSelect = (clip) => {
    setSelectedTimelineClip(clip);
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Box sx={{ width: 240, flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>
            <MediaLibrary 
              videos={videos} 
              onVideoUpload={handleVideoUpload}
              onFileSelect={handleFileSelect}
              selectedClip={selectedBinClip}
            />
          </Box>
          <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ flexGrow: 1, mb: 2 }}>
              <Grid item xs={6}>
                <Paper sx={{ height: '100%', p: 2 }}>
                  <BinViewer
                    selectedClip={selectedBinClip}
                  />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ height: '100%', p: 2 }}>
                  <TimelineViewer
                    selectedClip={selectedTimelineClip}
                  />
                </Paper>
              </Grid>
            </Grid>
            <Paper sx={{ p: 2, flexShrink: 0, height: 200 }}>
              <Timeline 
                clips={timelineClips}
                onClipSelect={handleTimelineClipSelect}
              />
              <Export clips={timelineClips} />
            </Paper>
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;