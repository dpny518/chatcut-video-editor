import { useState, useCallback } from 'react';

export function useTranscript() {
  // Explicitly initialize the selectedSegments state as an empty Set
  const [selectedSegments, setSelectedSegments] = useState(() => new Set());

  const toggleSegmentSelection = useCallback((globalIndex) => {
    setSelectedSegments(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(globalIndex)) {
        newSelection.delete(globalIndex);
      } else {
        newSelection.add(globalIndex);
      }
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSegments(new Set());
  }, []);

  const handleAddToTimeline = useCallback((selectedContent) => {
    const clipData = {
      id: `clip-${Date.now()}`,
      type: 'transcript',
      segments: selectedContent.map(segment => ({
        ...segment,
        metadata: {
          ...segment.metadata,
          timeline: {
            start: segment.start_time,
            end: segment.end_time,
            duration: segment.end_time - segment.start_time,
          }
        }
      }))
    };
    return clipData;
  }, []);

  // Ensure all values are defined before returning
  return {
    selectedSegments,
    toggleSegmentSelection,
    clearSelection,
    handleAddToTimeline
  };
} 