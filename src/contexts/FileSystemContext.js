// src/contexts/FileSystemContext.js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';

const FileSystemContext = createContext(undefined);

export const FileType = {
  FOLDER: 'folder',
  VIDEO: 'video',
  DOCX: 'docx',
  SRT: 'srt',
  JSON: 'json',
  UNKNOWN: 'unknown'
};

export const FileSystemProvider = ({ children, onError }) => {
  const [files, setFiles] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errorState, setErrorState] = useState(null);

  const getDirectoryItems = useCallback((parentId) => {
    return Object.values(files)
      .filter(file => file.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [files]);

  const determineFileType = (file) => {
    if (file.type.startsWith('video/')) return FileType.VIDEO;
    
    const extension = file.name.split('.').pop().toLowerCase();
    switch (extension) {
      case 'docx':
        return FileType.DOCX;
      case 'srt':
      case 'srtx':
        return FileType.SRT;
      case 'json':
        return FileType.JSON;
      default:
        return FileType.UNKNOWN;
    }
  };

  const addFile = useCallback(async (file, parentId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading file to server:', file.name);
      
      const response = await fetch('http://52.76.236.100:8000/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      const fileId = Date.now().toString();
      
      setFiles(prev => {
        const directoryItems = Object.values(prev)
          .filter(f => f.parentId === parentId)
          .sort((a, b) => a.order - b.order);
          
        const lastItem = directoryItems[directoryItems.length - 1];
        const order = lastItem ? lastItem.order + 1000 : 1000;

        return {
          ...prev,
          [fileId]: {
            id: fileId,
            name: file.name,
            type: determineFileType(file),
            parentId,
            order,
            content: JSON.stringify(result), // Store the API response
            file
          }
        };
      });

      return fileId;
    } catch (error) {
      console.error('Upload error:', error);
      setErrorState(`Upload failed: ${error.message}`);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  }, [onError]);

  const createFolder = useCallback((name, parentId) => {
    const folderId = Date.now().toString();
    setFiles(prev => {
      const directoryItems = Object.values(prev)
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.order - b.order);
        
      const lastItem = directoryItems[directoryItems.length - 1];
      const order = lastItem ? lastItem.order + 1000 : 1000;

      return {
        ...prev,
        [folderId]: {
          id: folderId,
          name,
          type: FileType.FOLDER,
          parentId,
          order
        }
      };
    });
  }, []);

  const moveItem = useCallback((itemId, newParentId, newOrder = null) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      const item = newFiles[itemId];
      const newParent = newFiles[newParentId];

      if (!item) return prev; // Item not found
      if (!newParent && newParentId !== null) return prev; // New parent not found (unless it's the root)

      // If the item is already in the correct place and order, do nothing
      if (item.parentId === newParentId && (newOrder === null || item.order === newOrder)) return prev;

      if (newOrder === null) {
        const directoryItems = getDirectoryItems(newParentId);
        const lastItem = directoryItems[directoryItems.length - 1];
        newOrder = lastItem ? lastItem.order + 1000 : 1000;
      }

      newFiles[itemId] = {
        ...item,
        parentId: newParentId,
        order: newOrder
      };

      return newFiles;
    });
  }, [getDirectoryItems]);

  const deleteItem = useCallback((itemId) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      const itemsToDelete = new Set();

      const collectItems = (id) => {
        itemsToDelete.add(id);
        Object.values(newFiles)
          .filter(file => file.parentId === id)
          .forEach(file => collectItems(file.id));
      };

      collectItems(itemId);
      itemsToDelete.forEach(id => delete newFiles[id]);

      return newFiles;
    });
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  }, []);

  const getTranscriptData = useCallback((fileIds) => {
    return fileIds
      .map(id => files[id])
      .filter(file => file && file.type !== 'folder' && file.content)
      .map(file => ({
        id: file.id,
        name: file.name,
        content: file.content
      }));
  }, [files]);

  const renameItem = useCallback((itemId, newName) => {
    setFiles(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        name: newName
      }
    }));
  }, []);

  const value = useMemo(() => ({
    files,
    selectedItems,
    uploadProgress,
    addFile,
    createFolder,
    moveItem,
    deleteItem,
    getDirectoryItems,
    setSelectedItems,
    getTranscriptData,
    renameItem
  }), [files, selectedItems, uploadProgress, addFile, createFolder, moveItem, deleteItem, getDirectoryItems, getTranscriptData, renameItem]);

  return (
    <FileSystemContext.Provider value={value}>
      {children}
      {errorState && (
        <Snackbar
          open={!!errorState}
          autoHideDuration={6000}
          onClose={() => setErrorState(null)}
        >
          <Alert
            onClose={() => setErrorState(null)}
            severity="error"
          >
            {errorState}
          </Alert>
        </Snackbar>
      )}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
};