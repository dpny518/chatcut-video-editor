import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import MediaLibrary from './components/MediaLibrary';
import BinViewer from './components/BinViewer';
import TimelineViewer from './components/TimelineViewer';
import Timeline from './components/Timeline';

const theme = createTheme();

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [timelineClips, setTimelineClips] = useState([]);

  const handleVideoUpload = (file) => {
    const newVideo = { id: Date.now().toString(), file: file, name: file.name };
    setVideos(prevVideos => [...prevVideos, newVideo]);
  };

  const handleFileSelect = (selectedVideo) => {
    setSelectedBinClip(selectedVideo);
  };

  const handleAddToTimeline = (clip) => {
    const newClip = {
      id: `clip${timelineClips.length + 1}`,
      file: clip.file,
      name: clip.file.name,
      startTime: clip.startTime,
      endTime: clip.endTime,
      duration: clip.endTime - clip.startTime
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
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            <Box sx={{ width: 240, flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>
              <MediaLibrary 
                videos={videos} 
                onVideoUpload={handleVideoUpload}
                onFileSelect={handleFileSelect}
                selectedClip={selectedBinClip}
              />
            </Box>
            <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'row' }}>
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ height: '100%', p: 2 }}>
                    <BinViewer
                      selectedClip={selectedBinClip}
                      onAddToTimeline={handleAddToTimeline}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ height: '100%', p: 2 }}>
                    <TimelineViewer clips={timelineClips} />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', flexGrow: 0 }}>
            <Timeline 
              clips={timelineClips}
              onClipsChange={handleTimelineClipsChange}
              sx={{ width: '100%' }} // Ensure the Timeline takes the full width
            />
            <Button variant="contained" color="primary" onClick={handleExportVideo} sx={{ mt: 2 }}>
              Export Video
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
