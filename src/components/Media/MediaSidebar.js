// src/components/Media/MediaSidebar.js
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTimelineManagement } from './hooks/useTimelineManagement';
import { useFileUpload } from './hooks/useFileUpload';
import { TimelineSection } from './TimelineSection';
import { DraggableFileList } from './DraggableFileList';
import { MediaUploadSection } from './MediaUploadSection';

const MediaSidebar = ({ 
  files = [], 
  onFileUpload, 
  onFileSelect, 
  selectedFiles = [], 
  timelineProjects 
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [orderedFiles, setOrderedFiles] = useState(files);
  const { handleFileUpload, uploadProgress } = useFileUpload(onFileUpload);
  const {
    contextMenu,
    saveDialogOpen,
    newTimelineName,
    timelines,
    handleSaveClick,
    handleSaveConfirm,
    handleTimelineContextMenu,
    handleContextClose,
    handleDeleteTimeline,
    handleLoadTimeline,
    setNewTimelineName,
    setSaveDialogOpen
  } = useTimelineManagement(timelineProjects);

  // Update orderedFiles when files prop changes
  useEffect(() => {
    setOrderedFiles(files);
  }, [files]);

  const handleReorder = useCallback((newFiles) => {
    setOrderedFiles(newFiles);
  }, []);

  // File selection handler that ensures array
  const handleFileSelect = useCallback((selectedFiles) => {
    if (onFileSelect) {
      const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
      onFileSelect(filesArray);
    }
  }, [onFileSelect]);

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
      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
        <Tab label="Media" />
        <Tab label="Timelines" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {currentTab === 0 ? (
          <>
            <MediaUploadSection onFileUpload={handleFileUpload} />
            <DraggableFileList
              files={orderedFiles}
              selectedFiles={selectedFiles || []}
              onFileSelect={handleFileSelect}
              onReorder={handleReorder}
              uploadProgress={uploadProgress}
            />
          </>
        ) : (
          <TimelineSection 
            selected={timelineProjects?.selected}
            onSaveClick={handleSaveClick}
            onTimelineLoad={timelineProjects?.onLoad}
            onTimelineContextMenu={handleTimelineContextMenu}
            timelines={timelines}
          />
        )}
      </Box>

      {/* Timeline Dialog */}
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

      {/* Timeline Context Menu */}
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
    </Box>
  );
};

export default MediaSidebar;