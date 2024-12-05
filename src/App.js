import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';
import PapercutViewerSection from './components/Viewers/PapercutViewerSection';
import ChatBot from './components/Chatbot/ChatBot';
import { FileSystemProvider } from './contexts/FileSystemContext';
import { SpeakerColorProvider } from './contexts/SpeakerColorContext';
import { PapercutProvider } from './contexts/PapercutContext';

const App = () => {
  const [themeMode, setThemeMode] = useState('dark');
  const [notification, setNotification] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [transcripts, setTranscripts] = useState(new Map());

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: { main: '#0ea5e9' },
      background: {
        default: themeMode === 'dark' ? '#121212' : '#ffffff',
        paper: themeMode === 'dark' ? '#1e1e1e' : '#f5f5f5',
      },
    },
  });

  const timelineState = {
    clips: [],
    totalDuration: 0,
    settings: {}
  };

  const toggleThemeMode = () => {
    setThemeMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  const handleChatMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (file) => {
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const transcriptData = JSON.parse(text);
        setTranscripts(prev => new Map(prev).set(file.name, transcriptData));
      }
    } catch (error) {
      showNotification(`Error uploading file: ${error.message}`, 'error');
    }
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FileSystemProvider 
          onFileUpload={handleFileUpload}
          onError={(message) => showNotification(message, 'error')}
        >
          <SpeakerColorProvider>
            <PapercutProvider>
              <MainLayout>
                <EditorLayout>
                  <IconButton
                    sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                    onClick={toggleThemeMode}
                    color="inherit"
                  >
                    {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>

                  <Box sx={{ 
                    display: 'flex', 
                    height: 'calc(100vh - 48px)', 
                    overflow: 'hidden',
                    gap: 2,
                    p: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <BinViewerSection />
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 2, 
                      flex: 1, 
                      minWidth: 0 
                    }}>
                      <Box sx={{ flex: 1, minHeight: 0 }}>
                        <TimelineViewerSection 
                          clips={[]}
                          transcript={transcripts}
                          timelineState={timelineState}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minHeight: 0 }}>
                        <PapercutViewerSection />
                      </Box>
                    </Box>
                  </Box>
                </EditorLayout>
                <ChatBot 
                  clips={[]}
                  messages={chatMessages}
                  onSendMessage={handleChatMessage}
                  selectedBinClip={selectedBinClip}
                  transcriptData={selectedBinClip ? transcripts.get(selectedBinClip.name) : null}
                  onAddToTimeline={() => {}}
                  timelineState={timelineState}
                  timelineRows={[]}
                  setTimelineRows={() => {}}
                  onClipsChange={() => {}}
                />
              </MainLayout>
            </PapercutProvider>
          </SpeakerColorProvider>
        </FileSystemProvider>

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



