import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  LinearProgress, 
  Button, 
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

// Import icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimelineIcon from '@mui/icons-material/Timeline';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const MediaSidebar = ({ 
  files, 
  onFileUpload, 
  onFileSelect, 
  selectedFile,
  timelineProjects 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
    setNewTimelineName(`Timeline ${new Date().toLocaleString()}`);
  };

  const handleSaveConfirm = () => {
    if (newTimelineName.trim()) {
      timelineProjects?.onSave?.(newTimelineName.trim());
      setSaveDialogOpen(false);
    }
  };

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setUploading(true);
    console.log(uploading)
    uploadedFiles.forEach(file => {
      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          
          // Remove this file's progress after completion
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          
          if (onFileUpload) {
            onFileUpload(file);
          }
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: progress
          }));
        }
      }, 500);
    });

    // Reset uploading state when all files are done
    const checkUploadComplete = setInterval(() => {
      setUploadProgress(prev => {
        if (Object.keys(prev).length === 0) {
          setUploading(false);
          clearInterval(checkUploadComplete);
        }
        return prev;
      });
    }, 1000);
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Timeline handling
  const handleTimelineContextMenu = (event, timeline) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      timeline
    });
  };

  const handleContextClose = () => {
    setContextMenu(null);
  };

  const handleDeleteTimeline = () => {
    if (contextMenu?.timeline) {
      timelineProjects?.onDelete?.(contextMenu.timeline);
      handleContextClose();
    }
  };

  const handleLoadTimeline = () => {
    if (contextMenu?.timeline) {
      timelineProjects?.onLoad?.(contextMenu.timeline);
      handleContextClose();
    }
  };

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
      {/* Tab Navigation */}
      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Media" />
        <Tab label="Timelines" />
      </Tabs>

      {/* Media Tab */}
      {currentTab === 0 && (
        <>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Media</Typography>
              <IconButton size="small">
                <ExpandMoreIcon />
              </IconButton>
            </Box>

            <label htmlFor="upload-input">
              <input
                id="upload-input"
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="video/*,image/*,audio/*"
              />
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
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

          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {files?.map(file => (
              <ListItem 
                key={file.id}
                selected={selectedFile?.id === file.id}
                onClick={() => onFileSelect?.(file)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getFileIcon(file.type)}
                </ListItemIcon>
                <ListItemText 
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption'
                  }}
                />
              </ListItem>
            ))}

            {Object.entries(uploadProgress).map(([id, progress]) => (
              progress < 100 && (
                <ListItem 
                  key={id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'block'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CloudUploadIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2">Uploading...</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    sx={{ height: 2 }}
                  />
                </ListItem>
              )
            ))}
          </List>
        </>
      )}

      {/* Timelines Tab */}
      {currentTab === 1 && (
      <>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            fullWidth
            onClick={handleSaveClick}
            sx={{ 
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'action.hover'
              }
            }}
          >
            Save Timeline
          </Button>
        </Box>

        {/* Save Dialog */}
        <Dialog 
          open={saveDialogOpen} 
          onClose={() => setSaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Save Timeline</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Timeline Name"
              fullWidth
              value={newTimelineName}
              onChange={(e) => setNewTimelineName(e.target.value)}
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {Object.entries(JSON.parse(localStorage.getItem('timelineProjects') || '{}')).map(([name, timeline]) => (
              <ListItem
                key={name}
                selected={timelineProjects?.selected === name}
                onContextMenu={(e) => handleTimelineContextMenu(e, name)}
                onClick={() => timelineProjects?.onLoad?.(name)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <TimelineIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={name}
                  secondary={new Date(timeline.timestamp).toLocaleString()}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption'
                  }}
                />
              </ListItem>
            ))}
          </List>

          {/* Context Menu */}
          <Menu
            open={contextMenu !== null}
            onClose={handleContextClose}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem onClick={handleLoadTimeline}>
              <ListItemIcon>
                <TimelineIcon fontSize="small" />
              </ListItemIcon>
              Load Timeline
            </MenuItem>
            <MenuItem onClick={handleDeleteTimeline}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Delete Timeline</Typography>
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};

export default MediaSidebar;