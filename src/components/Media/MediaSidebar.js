import React, { useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  LinearProgress, 
  Button,
  IconButton,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimelineIcon from '@mui/icons-material/Timeline';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import useMediaStore from '../../stores/mediaStore';
import { shallow } from 'zustand/shallow';

const MediaSidebar = () => {
  // Group related state selections to prevent multiple re-renders
  const { 
    files,
    selectedFile,
    uploadProgress,
    uploading,
    timelineProjects,
    selectedTimelineProject
  } = useMediaStore(state => ({
    files: state.files,
    selectedFile: state.selectedFile,
    uploadProgress: state.uploadProgress,
    uploading: state.uploading,
    timelineProjects: state.timelineProjects,
    selectedTimelineProject: state.selectedTimelineProject
  }), shallow);

  // Group actions
  const actions = useMemo(() => ({
    setSelectedFile: useMediaStore.getState().setSelectedFile,
    setUploadProgress: useMediaStore.getState().setUploadProgress,
    clearUploadProgress: useMediaStore.getState().clearUploadProgress,
    setUploading: useMediaStore.getState().setUploading,
    addFile: useMediaStore.getState().addFile,
    addTranscript: useMediaStore.getState().addTranscript,
    saveTimelineProject: useMediaStore.getState().saveTimelineProject,
    deleteTimelineProject: useMediaStore.getState().deleteTimelineProject,
    setSelectedTimelineProject: useMediaStore.getState().setSelectedTimelineProject,
    hasMatchingTranscript: useMediaStore.getState().hasMatchingTranscript,
    setNotification: useMediaStore.getState().setNotification
  }), []);

  // Local state
  const [currentTab, setCurrentTab] = React.useState(0);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [newTimelineName, setNewTimelineName] = React.useState('');

  // Memoized handlers
  const handleTabChange = useCallback((_, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const getFileIcon = useCallback((type) => {
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    if (type === 'application/json' || type.endsWith('.json')) return <TextSnippetIcon />;
    return <InsertDriveFileIcon />;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleFileUpload = useCallback(async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    actions.setUploading(true);
  
    for (const file of uploadedFiles) {
      const fileId = Date.now() + Math.random();
      actions.setUploadProgress(fileId, 0);
  
      try {
        if (file.type.startsWith('video/')) {
          await actions.addFile(file);
          
          const transcriptName = file.name.replace(/\.[^/.]+$/, '.json');
          if (actions.hasMatchingTranscript(transcriptName)) {
            actions.setNotification(`Found matching transcript for ${file.name}`, 'success');
          }
        } 
        else if (file.name.endsWith('.json')) {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
          
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
          
          await actions.addTranscript(file.name, transcriptData);
          
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = files.some(f => f.name === videoName);
          
          actions.setNotification(
            hasVideo 
              ? `Transcript loaded for ${videoName}` 
              : 'Transcript loaded. Upload matching video file to use it.',
            'success'
          );
        }
        
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            clearInterval(interval);
            actions.clearUploadProgress(fileId);
            
            if (Object.keys(uploadProgress).length === 0) {
              actions.setUploading(false);
            }
          } else {
            actions.setUploadProgress(fileId, progress);
          }
        }, 500);
      } catch (error) {
        console.error('Error processing file:', error);
        actions.setNotification(error.message, 'error');
        actions.clearUploadProgress(fileId);
      }
    }
  }, [actions, files, uploadProgress]);

  const handleTimelineContextMenu = useCallback((event, timeline) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      timeline
    });
  }, []);

  const handleContextClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleLoadTimeline = useCallback(() => {
    if (contextMenu?.timeline) {
      actions.setSelectedTimelineProject(contextMenu.timeline);
      handleContextClose();
    }
  }, [contextMenu, actions, handleContextClose]);

  const handleDeleteTimeline = useCallback(() => {
    if (contextMenu?.timeline) {
      actions.deleteTimelineProject(contextMenu.timeline);
      handleContextClose();
      actions.setNotification(`Timeline "${contextMenu.timeline}" deleted`, 'success');
    }
  }, [contextMenu, actions, handleContextClose]);

  const handleSaveClick = useCallback(() => {
    setSaveDialogOpen(true);
    setNewTimelineName(`Timeline ${new Date().toLocaleString()}`);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    if (newTimelineName.trim()) {
      actions.saveTimelineProject(newTimelineName.trim());
      setSaveDialogOpen(false);
      actions.setNotification(`Timeline "${newTimelineName}" saved`, 'success');
    }
  }, [newTimelineName, actions]);

  const handleFileSelect = useCallback((file) => {
    actions.setSelectedFile(file);
  }, [actions]);

  const handleTimelineNameChange = useCallback((e) => {
    setNewTimelineName(e.target.value);
  }, []);

  const handleSaveDialogClose = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  // Memoized lists
  const memoizedFiles = useMemo(() => 
    files.map(file => (
      <ListItem 
        key={file.id}
        selected={selectedFile?.id === file.id}
        onClick={() => handleFileSelect(file)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
        <ListItemText 
          primary={file.name} 
          secondary={formatFileSize(file.size)}
          sx={{ 
            '.MuiListItemText-secondary': {
              color: 'text.secondary'
            } 
          }} 
        />
      </ListItem>
    )), [files, selectedFile, handleFileSelect, getFileIcon, formatFileSize]);

  const memoizedTimelineProjects = useMemo(() => 
    Object.keys(timelineProjects).map((timeline) => (
      <ListItem 
        key={timeline}
        selected={selectedTimelineProject === timeline}
        onClick={() => actions.setSelectedTimelineProject(timeline)}
        onContextMenu={(e) => handleTimelineContextMenu(e, timeline)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <ListItemIcon>
          <TimelineIcon />
        </ListItemIcon>
        <ListItemText primary={timeline} />
      </ListItem>
    )), [timelineProjects, selectedTimelineProject, actions, handleTimelineContextMenu]);

  // Memoize UI elements
  const tabsSection = useMemo(() => (
    <Tabs 
      value={currentTab} 
      onChange={handleTabChange}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab label="Media" />
      <Tab label="Timelines" />
    </Tabs>
  ), [currentTab, handleTabChange]);

  return (
    <Box 
      sx={{
        width: 240,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {tabsSection}

      {currentTab === 0 ? (
        files.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Upload video files with matching .json transcripts
            </Typography>
            <label htmlFor="upload-input">
              <input
                id="upload-input"
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="video/*,audio/*,.json"
              />
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={uploading}
                sx={{ 
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                Upload
              </Button>
            </label>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Media</Typography>
                <IconButton size="small">
                  <ExpandMoreIcon />
                </IconButton>
              </Box>

              <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
                Upload video files with matching .json transcripts
              </Typography>
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {memoizedFiles}
            </List>

            {uploading && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress />
              </Box>
            )}
          </>
        )
      ) : (
        <>
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {memoizedTimelineProjects}
          </List>

          <Box sx={{ p: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveClick} 
              fullWidth
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              Save Timeline
            </Button>
          </Box>
        </>
      )}

      <Menu
        open={!!contextMenu}
        onClose={handleContextClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleLoadTimeline}>Load Timeline</MenuItem>
        <MenuItem onClick={handleDeleteTimeline}>Delete Timeline</MenuItem>
      </Menu>

      <Dialog open={saveDialogOpen} onClose={handleSaveDialogClose}>
        <DialogTitle>Save Timeline</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus
            fullWidth
            label="Timeline Name"
            variant="outlined"
            value={newTimelineName}
            onChange={handleTimelineNameChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'text.primary'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveDialogClose} color="primary">Cancel</Button>
          <Button 
            onClick={handleSaveConfirm} 
            color="primary" 
            variant="contained"
            disabled={!newTimelineName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(MediaSidebar, (prev, next) => {
  // Add proper comparison for MediaSidebar props if needed
  return true; // Modify based on your actual prop comparison needs
});