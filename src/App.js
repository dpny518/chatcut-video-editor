import React, { useState } from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import { CssBaseline, Box, Snackbar, Alert, IconButton } from '@mui/material';


import MainLayout from './components/Layout/MainLayout';
import EditorLayout from './components/Layout/EditorLayout';
import BinViewerSection from './components/Viewers/BinViewerSection';
import TimelineViewerSection from './components/Viewers/TimelineViewerSection';
import PapercutViewerSection from './components/Viewers/PapercutViewer/PapercutViewerSection';
import ChatBot from './components/Chatbot/ChatBot';
import { FileSystemProvider } from './contexts/FileSystemContext';
import { SpeakerColorProvider } from './contexts/SpeakerColorContext';
import { PapercutProvider } from './contexts/PapercutContext';
import { PapercutHistoryProvider } from './contexts/PapercutHistoryContext';
import { TranscriptStylingProvider } from './contexts/TranscriptStylingContext';
import { TranscriptClipboardProvider } from './contexts/TranscriptClipboardContext';
import SearchPage from './components/Pages/SearchPage';
import NotificationsPage from './components/Pages/NotificationsPage';
import ProfilePage from './components/Pages/ProfilePage';
import SettingsPage from './components/Pages/SettingsPage';
import BillingPage from './components/Pages/BillingPage';
import SupportPage from './components/Pages/SupportPage';

const App = () => {
  const [themeMode, setThemeMode] = useState('dark');
  const [notification, setNotification] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedBinClip, setSelectedBinClip] = useState(null);
  const [transcripts, setTranscripts] = useState(new Map());
  const [currentView, setCurrentView] = useState('editor');

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

  const handleThemeChange = () => {
    setThemeMode(mode => mode === 'dark' ? 'light' : 'dark');
  };
  

  const timelineState = {
    clips: [],
    totalDuration: 0,
    settings: {}
  };

  const handleFileUpload = async (file) => {
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const transcriptData = JSON.parse(text);
        setTranscripts(prev => new Map(prev).set(file.name, transcriptData));
      }
    } catch (error) {
      setNotification({ message: `Error uploading file: ${error.message}`, severity: 'error' });
    }
  };

// Update renderContent in App.js
const renderContent = () => {
  switch(currentView) {
    case 'home':
      case 'editor':
        return (
          <EditorLayout>
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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PapercutViewerSection transcriptData={transcripts} />
              </Box>
            </Box>
          </EditorLayout>
        );
    case 'search':
      return <SearchPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'profile':
      return <ProfilePage />;
    case 'settings':
      return <SettingsPage themeMode={themeMode} onThemeChange={handleThemeChange} />;
    case 'billing':
      return <BillingPage />;
    case 'support':
      return <SupportPage />;
    default:
      return null;
  }
};

return (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FileSystemProvider onFileUpload={handleFileUpload}>
        <SpeakerColorProvider>
          <PapercutHistoryProvider>
            <PapercutProvider>
              <TranscriptStylingProvider>
                <TranscriptClipboardProvider>
                  <MainLayout
                    themeMode={themeMode}
                    onThemeChange={handleThemeChange}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    mediaFiles={[]}
                    selectedBinClip={selectedBinClip}
                    onFileSelect={setSelectedBinClip}
                    onFileUpload={handleFileUpload}
                  >
                    {renderContent()}
                    <ChatBot 
                      clips={[]}
                      messages={chatMessages}
                      onSendMessage={(msg) => setChatMessages(prev => [...prev, msg])}
                      selectedBinClip={selectedBinClip}
                      transcriptData={selectedBinClip ? transcripts.get(selectedBinClip.name) : null}
                      timelineState={timelineState}
                      timelineRows={[]}
                      setTimelineRows={() => {}}
                      onClipsChange={() => {}}
                    />
                  </MainLayout>
                </TranscriptClipboardProvider>
              </TranscriptStylingProvider>
            </PapercutProvider>
          </PapercutHistoryProvider>
        </SpeakerColorProvider>
      </FileSystemProvider>
      <Snackbar /* ... */ />
    </ThemeProvider>
  </StyledEngineProvider>
);
};

export default App;