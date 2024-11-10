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
 

  const [lastChecked, setLastChecked] = useState(null);

  const handleCheckboxChange = (file, event) => {
    event.stopPropagation();
    console.log('Checkbox clicked for:', file.name);
    console.log('Current selections:', selectedFiles?.map(f => f.name));

    // Create new array from current selections
    let newSelection = selectedFiles ? [...selectedFiles] : [];

    if (event.shiftKey && lastChecked) {
        // Handle range selection
        const filesList = files;
        const start = filesList.indexOf(lastChecked);
        const end = filesList.indexOf(file);
        const range = filesList.slice(
            Math.min(start, end),
            Math.max(start, end) + 1
        );

        console.log('Shift-click range:', range.map(f => f.name));

        // If lastChecked is selected, add all in range. Otherwise remove all.
        const isAdding = selectedFiles?.some(f => f.id === lastChecked.id);
        
        if (isAdding) {
            // Add all files in range that aren't already selected
            range.forEach(rangeFile => {
                if (!newSelection.some(f => f.id === rangeFile.id)) {
                    newSelection.push(rangeFile);
                }
            });
        } else {
            // Remove all files in range
            newSelection = newSelection.filter(f => 
                !range.some(rangeFile => rangeFile.id === f.id)
            );
        }
    } else {
        // Toggle single selection
        const fileIndex = newSelection.findIndex(f => f.id === file.id);
        if (fileIndex >= 0) {
            // Remove if already selected
            newSelection.splice(fileIndex, 1);
        } else {
            // Add to selection
            newSelection.push(file);
        }
        setLastChecked(file);
    }

    // Keep track of selection order
    newSelection.sort((a, b) => {
        const aIndex = files.findIndex(f => f.id === a.id);
        const bIndex = files.findIndex(f => f.id === b.id);
        return aIndex - bIndex;
    });

    console.log('New selection:', newSelection.map(f => f.name));
    onFileSelect(newSelection);
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
    selected={selectedFiles?.some(f => f.id === file.id)}
    sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '&:hover': {
            bgcolor: 'action.hover'
        }
    }}
>
    <Checkbox
        edge="start"
        checked={selectedFiles?.some(f => f.id === file.id)}
        onChange={(e) => handleCheckboxChange(file, e)}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        disableRipple
    />
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
        display: 'block',
        padding: 2
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

  {selectedFiles?.length > 0 && (
  <Box sx={{ 
    p: 2, 
    borderTop: 1, 
    borderColor: 'divider',
    bgcolor: selectedFiles.length > 1 ? 'primary.dark' : 'transparent'
  }}>
    <Typography 
      variant="body2" 
      color={selectedFiles.length > 1 ? 'primary.contrastText' : 'text.secondary'}
    >
      {selectedFiles.length} files selected
      {selectedFiles.length > 1 && ' (will be merged)'}
    </Typography>
    {selectedFiles.length > 1 && (
      <Typography variant="caption" color="primary.contrastText">
        Order: {selectedFiles.map(f => f.name.split('.')[0]).join(' → ')}
      </Typography>
    )}
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