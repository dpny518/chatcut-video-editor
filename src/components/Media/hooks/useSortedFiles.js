// src/components/Media/hooks/useSortedFiles.js
import { useMemo } from 'react';

export const useSortedFiles = (files, sortBy, sortDirection, selectedFiles) => {
  // Sorting functions for different criteria
  const sortFunctions = {
    name: (a, b) => a.name.localeCompare(b.name),
    date: (a, b) => new Date(b.lastModified) - new Date(a.lastModified),
    size: (a, b) => b.size - a.size,
    duration: (a, b) => (b.duration || 0) - (a.duration || 0),
    type: (a, b) => a.type.localeCompare(b.type)
  };

  // Memoized sorted files
  const sortedFiles = useMemo(() => {
    if (!files) return [];
    
    // First sort the files based on the selected criteria
    const sorted = [...files].sort((a, b) => {
      const result = sortFunctions[sortBy](a, b);
      return sortDirection === 'asc' ? result : -result;
    });

    // Then reorder selected files to the top if they exist
    if (selectedFiles.length > 0) {
      const selectedIds = new Set(selectedFiles.map(f => f.id));
      const selected = sorted.filter(f => selectedIds.has(f.id));
      const unselected = sorted.filter(f => !selectedIds.has(f.id));
      return [...selected, ...unselected];
    }

    return sorted;
  }, [files, sortBy, sortDirection, selectedFiles]);

  // Get the reordered indices for selected files
  const getSelectedIndices = () => {
    return selectedFiles.map(file => sortedFiles.findIndex(f => f.id === file.id));
  };

  return {
    sortedFiles,
    getSelectedIndices
  };
};