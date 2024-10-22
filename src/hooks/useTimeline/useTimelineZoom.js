import { useState, useCallback } from 'react';
import { MIN_SCALE, MAX_SCALE, SCALE_STEP } from '../../utils/constants';

export const useTimelineZoom = (initialScale = 1) => {
  const [scale, setScale] = useState(initialScale);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  return { scale, handleZoomIn, handleZoomOut };
};