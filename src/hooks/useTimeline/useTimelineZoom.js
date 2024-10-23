import { useState, useCallback } from 'react';

// Constants for zoom control
const MIN_SCALE = 0.1;  // Reduced from 0.5 to allow more zoom out
const MAX_SCALE = 3;    // Increased from 2 to allow more zoom in
const SCALE_STEP = 0.1;
const WHEEL_ZOOM_SPEED = 0.001;

export const useTimelineZoom = (initialScale = 1) => {
  const [scale, setScale] = useState(initialScale);
  
  // Ensure scale stays within bounds
  const clampScale = useCallback((newScale) => {
    return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
  }, []);

  // Handle manual zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => clampScale(prev + SCALE_STEP));
  }, [clampScale]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => clampScale(prev - SCALE_STEP));
  }, [clampScale]);

  // Handle wheel zoom
  const handleWheelZoom = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = -event.deltaY * WHEEL_ZOOM_SPEED;
      setScale(prev => clampScale(prev + delta));
    }
  }, [clampScale]);

  // Reset zoom to fit all content
  const fitToContent = useCallback((totalDuration) => {
    if (!totalDuration) return;
    // Calculate ideal scale to fit content
    // Assuming timeline width is around 1000px (adjust based on your UI)
    const idealScale = 1000 / totalDuration;
    setScale(clampScale(idealScale));
  }, [clampScale]);

  return {
    scale,
    setScale,
    handleZoomIn,
    handleZoomOut,
    handleWheelZoom,
    fitToContent,
    MIN_SCALE,
    MAX_SCALE
  };
};