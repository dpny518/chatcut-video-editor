// src/components/Media/FileSystemTree.js
import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { useFileSystem } from '../../contexts/FileSystemContext';
import FileItem from './FileItem';

const FileSystemTree = ({ parentId, depth = 0 }) => {
  const { getDirectoryItems, moveItem } = useFileSystem();
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [dropTarget, setDropTarget] = useState(null);
  const items = getDirectoryItems(parentId);

  const handleDragOver = useCallback((id, position) => {
    setDropTarget({ id, position });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('text');
    
    if (!draggedItemId || !dropTarget || draggedItemId === dropTarget.id) {
      setDropTarget(null);
      return;
    }

    if (dropTarget.position === 'inside') {
      // Move item into folder
      moveItem(draggedItemId, dropTarget.id);
      // Automatically expand the folder when dropping items into it
      setExpandedFolders(prev => new Set([...prev, dropTarget.id]));
    } else {
      // Reorder items
      const targetIndex = items.findIndex(item => item.id === dropTarget.id);
      const newIndex = dropTarget.position === 'before' ? targetIndex : targetIndex + 1;
      const draggedIndex = items.findIndex(item => item.id === draggedItemId);
      
      if (draggedIndex === -1) {
        // Item is coming from a different folder
        moveItem(draggedItemId, parentId, newIndex * 1000);
      } else {
        // Item is being reordered within the same folder
        if (draggedIndex < newIndex) {
          newIndex--;
        }
        
        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(newIndex, 0, removed);
        
        newItems.forEach((item, index) => {
          moveItem(item.id, parentId, index * 1000);
        });
      }
    }
    
    setDropTarget(null);
  }, [dropTarget, items, moveItem, parentId]);

  const handleToggleExpand = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {dropTarget?.id === item.id && dropTarget?.position === 'before' && (
            <Box sx={{ height: '2px', bgcolor: 'primary.main', mx: 1 }} />
          )}
          <FileItem
            file={item}
            depth={depth}
            onDragOver={handleDragOver}
            isExpanded={expandedFolders.has(item.id)}
            onToggleExpand={handleToggleExpand}
            index={index}
          />
          {item.type === 'folder' && expandedFolders.has(item.id) && (
            <FileSystemTree 
              parentId={item.id} 
              depth={depth + 1}
            />
          )}
          {dropTarget?.id === item.id && dropTarget?.position === 'after' && (
            <Box sx={{ height: '2px', bgcolor: 'primary.main', mx: 1 }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default FileSystemTree;