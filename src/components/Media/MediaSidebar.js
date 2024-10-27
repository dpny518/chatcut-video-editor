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

const MediaSidebar = () => {
  // Split store selectors
  const files = useMediaStore(state => state.files);
  const selectedFile = useMediaStore(state => state.selectedFile);
  const uploadProgress = useMediaStore(state => state.uploadProgress);
  const uploading = useMediaStore(state => state.uploading);
  const timelineProjects = useMediaStore(state => state.timelineProjects);
  const selectedTimelineProject = useMediaStore(state => state.selectedTimelineProject);
  
  // Actions
  const setSelectedFile = useMediaStore(state => state.setSelectedFile);
  const setUploadProgress = useMediaStore(state => state.setUploadProgress);
  const clearUploadProgress = useMediaStore(state => state.clearUploadProgress);
  const setUploading = useMediaStore(state => state.setUploading);
  const addFile = useMediaStore(state => state.addFile);
  const addTranscript = useMediaStore(state => state.addTranscript);
  const saveTimelineProject = useMediaStore(state => state.saveTimelineProject);
  const deleteTimelineProject = useMediaStore(state => state.deleteTimelineProject);
  const setSelectedTimelineProject = useMediaStore(state => state.setSelectedTimelineProject);
  const hasMatchingTranscript = useMediaStore(state => state.hasMatchingTranscript);
  const setNotification = useMediaStore(state => state.setNotification);

  const [currentTab, setCurrentTab] = React.useState(0);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [newTimelineName, setNewTimelineName] = React.useState('');

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
    setUploading(true);
  
    for (const file of uploadedFiles) {
      const fileId = Date.now() + Math.random();
      setUploadProgress(fileId, 0);
  
      try {
        if (file.type.startsWith('video/')) {
          await addFile(file);
          
          const transcriptName = file.name.replace(/\.[^/.]+$/, '.json');
          if (hasMatchingTranscript(transcriptName)) {
            setNotification(`Found matching transcript for ${file.name}`, 'success');
          }
        } 
        else if (file.name.endsWith('.json')) {
          const text = await file.text();
          const transcriptData = JSON.parse(text);
          
          if (!transcriptData.transcription) {
            throw new Error('Invalid transcript format');
          }
          
          await addTranscript(file.name, transcriptData);
          
          const videoName = file.name.replace('.json', '.mp4');
          const hasVideo = files.some(f => f.name === videoName);
          
          setNotification(
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
            clearUploadProgress(fileId);
            
            if (Object.keys(uploadProgress).length === 0) {
              setUploading(false);
            }
          } else {
            setUploadProgress(fileId, progress);
          }
        }, 500);
      } catch (error) {
        console.error('Error processing file:', error);
        setNotification(error.message, 'error');
        clearUploadProgress(fileId);
      }
    }
  }, [
    addFile, 
    addTranscript, 
    setUploadProgress, 
    clearUploadProgress, 
    setUploading, 
    hasMatchingTranscript,
    setNotification,
    files
  ]);

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
      setSelectedTimelineProject(contextMenu.timeline);
      handleContextClose();
    }
  }, [contextMenu, setSelectedTimelineProject, handleContextClose]);

  const handleDeleteTimeline = useCallback(() => {
    if (contextMenu?.timeline) {
      deleteTimelineProject(contextMenu.timeline);
      handleContextClose();
      setNotification(`Timeline "${contextMenu.timeline}" deleted`, 'success');
    }
  }, [contextMenu, deleteTimelineProject, handleContextClose, setNotification]);

  const handleSaveClick = useCallback(() => {
    setSaveDialogOpen(true);
    setNewTimelineName(`Timeline ${new Date().toLocaleString()}`);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    if (newTimelineName.trim()) {
      saveTimelineProject(newTimelineName.trim());
      setSaveDialogOpen(false);
      setNotification(`Timeline "${newTimelineName}" saved`, 'success');
    }
  }, [newTimelineName, saveTimelineProject, setNotification]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
  }, [setSelectedFile]);

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
          secondary={`${formatFileSize(file.size)}`} 
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
          onClick={() => setSelectedTimelineProject(timeline)}
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
      )), [timelineProjects, selectedTimelineProject, setSelectedTimelineProject, handleTimelineContextMenu]);

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
      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Media" />
        <Tab label="Timelines" />
      </Tabs>

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

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Timeline</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus
            fullWidth
            label="Timeline Name"
            variant="outlined"
            value={newTimelineName}
            onChange={(e) => setNewTimelineName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'text.primary'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} color="primary">Cancel</Button>
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

export default MediaSidebar;