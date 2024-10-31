// src/components/Media/hooks/useFileUpload.js
import { useState, useCallback } from 'react';

export const useFileUpload = (onFileUpload) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileUpload = useCallback((event) => {
    const uploadedFiles = Array.from(event.target.files);
    setUploading(true);
    
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
  }, [onFileUpload]);

  // Clear upload progress
  const clearUploadProgress = useCallback(() => {
    setUploadProgress({});
    setUploading(false);
  }, []);

  return {
    uploading,
    uploadProgress,
    handleFileUpload,
    clearUploadProgress
  };
};