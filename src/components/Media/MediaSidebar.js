import React, { useState } from 'react';
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
  TextField,
  Checkbox
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
import MergeIcon from '@mui/icons-material/CallMerge';

const MediaSidebar = ({ 
  files, 
  onFileUpload, 
  onFileSelect,
  selectedFiles, // Changed from selectedFile
  timelineProjects,
  masterClipManager
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');
  const [selectionMode, setSelectionMode] = useState('single');

  const handleFileClick = (file, event) => {
    if (selectionMode === 'single') {
      onFileSelect([file]); // Always send as array
    } else {
      // Multiple selection mode
      const newSelection = new Set(selectedFiles || []);
      
      if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        if (newSelection.has(file)) {
          newSelection.delete(file);
        } else {
          newSelection.add(file);
        }
      } else if (event.shiftKey && selectedFiles?.length > 0) {
        // Range selection
        const filesList = files.map(f => f);
        const lastSelected = selectedFiles[selectedFiles.length - 1];
        const startIdx = filesList.indexOf(lastSelected);
        const endIdx = filesList.indexOf(file);
        const range = filesList.slice(
          Math.min(startIdx, endIdx),
          Math.max(startIdx, endIdx) + 1
        );
        range.forEach(f => newSelection.add(f));
      } else {
        // Simple selection
        newSelection.clear();
        newSelection.add(file);
      }
      
      onFileSelect(Array.from(newSelection));
    }
  };

  const toggleSelectionMode = () => {
    if (selectionMode === 'single') {
      setSelectionMode('multiple');
    } else {
      setSelectionMode('single');
      onFileSelect(selectedFiles?.slice(0, 1) || []); // Keep only first selection
    }
  };

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
    
    uploadedFiles.forEach(file => {
      const fileId = Date.now() + Math.random();
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          
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

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    if (type === 'application/json' || type.endsWith('.json')) return <TextSnippetIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{
      width: 240,
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Media" />
        <Tab label="Timelines" />
      </Tabs>

      {currentTab === 0 && (
        <>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MergeIcon />}
                onClick={toggleSelectionMode}
                sx={{ width: '100%' }}
              >
                {selectionMode === 'single' ? 'Enable Merge Mode' : 'Disable Merge Mode'}
              </Button>

              <label htmlFor="upload-input">
                <input
                  id="upload-input"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="video/*,.json"
                />
                <Button
                  component="span"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  Upload Files
                </Button>
              </label>

              <Typography variant="caption" color="text.secondary">
                Upload video files with matching .json transcripts
              </Typography>
            </Box>
          </Box>

          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {files?.map(file => (
              <ListItem 
                key={file.id}
                onClick={(e) => handleFileClick(file, e)}
                selected={selectedFiles?.includes(file)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  cursor: 'pointer'
                }}
              >
                {selectionMode === 'multiple' && (
                  <Checkbox
                    edge="start"
                    checked={selectedFiles?.includes(file)}
                    tabIndex={-1}
                    disableRipple
                  />
                )}
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
                />
              </ListItem>
            ))}

            {/* Upload Progress Items */}
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

          {selectionMode === 'multiple' && selectedFiles?.length > 0 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                {selectedFiles.length} files selected
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Timelines Tab - Same as original */}
      {currentTab === 1 && (
        <>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              fullWidth
              onClick={handleSaveClick}
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