// src/components/Media/DraggableFileList.js
import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Checkbox, Box } from '@mui/material';
import { getFileIcon, formatFileSize, formatDuration } from './utils';
import { UploadProgress } from './UploadProgress';

export const DraggableFileList = ({ 
  files = [], 
  selectedFiles = [], // Ensure it's an array with default value
  onFileSelect,
  onReorder,
  uploadProgress = {}
}) => {
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newFiles = [...files];
    const [movedFile] = newFiles.splice(dragIndex, 1);
    newFiles.splice(dropIndex, 0, movedFile);
    onReorder(newFiles);
  };

  const isSelected = (file) => {
    return Array.isArray(selectedFiles) && 
           selectedFiles.some(selectedFile => selectedFile.id === file.id);
  };

  const handleSelect = (e, file) => {
    e.stopPropagation();
    if (onFileSelect) {
      if (e.target.type === 'checkbox') {
        // Handle checkbox selection
        if (e.target.checked) {
          onFileSelect([...selectedFiles, file]);
        } else {
          onFileSelect(selectedFiles.filter(f => f.id !== file.id));
        }
      } else {
        // Handle click selection
        if (e.ctrlKey || e.metaKey) {
          // Toggle selection
          if (isSelected(file)) {
            onFileSelect(selectedFiles.filter(f => f.id !== file.id));
          } else {
            onFileSelect([...selectedFiles, file]);
          }
        } else {
          // Single selection
          onFileSelect([file]);
        }
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
      <List>
        {files.map((file, index) => (
          <ListItem
            key={file.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={(e) => handleSelect(e, file)}
            selected={isSelected(file)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              cursor: 'grab',
              '&:hover': {
                bgcolor: 'action.hover'
              },
              ...(isSelected(file) && {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.selected'
                }
              })
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Checkbox
                edge="start"
                checked={isSelected(file)}
                onChange={(e) => handleSelect(e, file)}
                onClick={(e) => e.stopPropagation()}
              />
              {getFileIcon(file.type)}
            </ListItemIcon>
            <ListItemText 
              primary={file.name}
              secondary={
                <>
                  {formatFileSize(file.size)}
                  {file.duration && ` • ${formatDuration(file.duration)}`}
                </>
              }
              primaryTypographyProps={{
                variant: 'body2',
                noWrap: true
              }}
            />
          </ListItem>
        ))}
        {Object.keys(uploadProgress).length > 0 && (
          <UploadProgress uploadProgress={uploadProgress} />
        )}
      </List>
    </Box>
  );
};