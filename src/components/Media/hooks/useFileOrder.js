// src/components/Media/hooks/useFileOrder.js
import { useState, useCallback } from 'react';

export const useFileOrder = (initialFiles = []) => {
  const [orderedFiles, setOrderedFiles] = useState(initialFiles);
  const [manualOrder, setManualOrder] = useState(false);

  const handleReorder = useCallback((newOrder) => {
    setOrderedFiles(newOrder);
    setManualOrder(true);
  }, []);

  const resetOrder = useCallback(() => {
    setOrderedFiles(initialFiles);
    setManualOrder(false);
  }, [initialFiles]);

  return {
    orderedFiles,
    manualOrder,
    handleReorder,
    resetOrder
  };
};