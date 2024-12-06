import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import {
  ChevronRight,
  ExpandMore,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFileSystem } from '../../contexts/FileSystemContext';
import FileTypeIcon from './FileTypeIcon';

const FileItem = ({ file, depth = 0, onDragOver, isExpanded, onToggleExpand, index }) => {
  const { deleteItem, renameItem, selectedItems, setSelectedItems, getDirectoryItems } = useFileSystem();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(getDisplayName(file.name));
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const ref = useRef(null);

  const isSelected = selectedItems.includes(file.id);
  const lastSelectedRef = useRef(null);

  // Helper function to remove file extension
  function getDisplayName(filename) {
    if (file.type === 'folder') return filename;
    return filename.replace(/\.[^/.]+$/, "");
  }

  // Helper function to preserve file extension during rename
  function getFullName(displayName) {
    if (file.type === 'folder') return displayName;
    const extension = file.name.match(/\.[^/.]+$/)?.[0] || '';
    return `${displayName}${extension}`;
  }

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    setIsRenaming(true);
    handleMenuClose();
  };

  const handleRenameSubmit = () => {
    const fullName = getFullName(newName);
    renameItem(file.id, fullName);
    setIsRenaming(false);
  };
  const handleDelete = () => {
    deleteItem(file.id);
    handleMenuClose();
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', file.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (file.type === 'folder') {
      setIsDraggingOver(true);
      onDragOver(file.id, 'inside');
    } else {
      const rect = ref.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      onDragOver(file.id, y < rect.height / 2 ? 'before' : 'after');
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleSelect = (event) => {
    event.stopPropagation();
    
    if (file.type === 'folder') {
      onToggleExpand(file.id);
      return;
    }

    // Command/Ctrl click for multiple selection
    if (event.metaKey || event.ctrlKey) {
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(file.id)) {
          newSelection.delete(file.id);
        } else {
          newSelection.add(file.id);
        }
        lastSelectedRef.current = file.id;
        return Array.from(newSelection);
      });
      return;
    }

    // Shift click for range selection
    if (event.shiftKey && lastSelectedRef.current) {
      const items = getDirectoryItems(file.parentId);
      const selectableItems = items.filter(item => item.type !== 'folder');
      
      // Find indices in the filtered list
      const currentIndex = selectableItems.findIndex(item => item.id === file.id);
      const lastIndex = selectableItems.findIndex(item => item.id === lastSelectedRef.current);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        // Get all existing selections that are not in the current directory
        const outsideSelections = selectedItems.filter(id => 
          !selectableItems.some(item => item.id === id)
        );
        
        // Add the range selection from the current directory
        const rangeSelection = selectableItems
          .slice(start, end + 1)
          .map(item => item.id);
        
        setSelectedItems([...outsideSelections, ...rangeSelection]);
      }
      return;
    }

    // Regular click - select only this item
    setSelectedItems([file.id]);
    lastSelectedRef.current = file.id;
  };

  return (
    <Box
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        pl: 1 + depth * 2,
        py: 0.5,
        cursor: 'pointer',
        bgcolor: isSelected 
          ? 'action.selected' 
          : isDraggingOver 
          ? 'action.hover' 
          : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        color: isSelected ? 'primary.main' : 'text.primary',
      }}
    >
      {file.type === 'folder' && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(file.id);
          }}
          sx={{ p: 0.5, mr: 0.5 }}
        >
          {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
      )}
      <FileTypeIcon type={file.type} />
      <Box sx={{ ml: 1, flexGrow: 1 }}>
        {isRenaming ? (
          <TextField
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
            size="small"
            autoFocus
            sx={{ fontSize: '0.875rem' }}
            onClick={(e) => e.stopPropagation()} // Prevent select when clicking textfield
          />
        ) : (
          <Typography 
            variant="body2"
            sx={{
              fontWeight: isSelected ? 500 : 400,
            }}
          >
            {getDisplayName(file.name)}
          </Typography>
        )}
      </Box>
      <IconButton 
        size="small" 
        onClick={(e) => {
          e.stopPropagation();
          handleMenuOpen(e);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRename}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FileItem;