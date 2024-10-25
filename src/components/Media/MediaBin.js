// src/components/Media/MediaBin.js
import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { 
  MoreVertical, 
  Trash2, 
  VideoIcon, 
  Clock,
  Info 
} from 'lucide-react';

const MediaBin = ({ 
  mediaFiles = [], 
  onDeleteMedia,
  onSelectMedia,
  selectedMedia,
  onAddToTimeline
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle context menu
  const handleContextMenu = (event, file) => {
    event.preventDefault();
    setSelectedFile(file);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  // Close context menu
  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  // Handle file selection
  const handleSelect = (file) => {
    onSelectMedia?.(file);
  };

  // Handle file deletion
  const handleDelete = (file) => {
    handleCloseMenu();
    onDeleteMedia?.(file);
  };

  // Add to timeline
  const handleAddToTimeline = (file) => {
    handleCloseMenu();
    onAddToTimeline?.(file);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="subtitle1" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Media Bin
      </Typography>

      <List sx={{ 
        width: '100%', 
        bgcolor: 'background.paper',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 200px)'
      }}>
        {mediaFiles.map((file) => (
          <ListItem
            key={file.name}
            selected={selectedMedia?.name === file.name}
            onClick={() => handleSelect(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <VideoIcon size={20} style={{ marginRight: 8 }} />
            <ListItemText
              primary={file.name}
              secondary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={14} />
                  {formatDuration(file.duration || 0)}
                  <Divider orientation="vertical" flexItem />
                  {formatSize(file.size)}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="More options">
                <IconButton 
                  edge="end" 
                  onClick={(e) => handleContextMenu(e, file)}
                >
                  <MoreVertical size={20} />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}

        {mediaFiles.length === 0 && (
          <ListItem>
            <ListItemText 
              primary="No media files"
              secondary="Upload videos to get started"
              sx={{ textAlign: 'center', color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleAddToTimeline(selectedFile)}>
          Add to Timeline
        </MenuItem>
        <MenuItem onClick={() => handleSelect(selectedFile)}>
          View Details
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDelete(selectedFile)}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MediaBin;