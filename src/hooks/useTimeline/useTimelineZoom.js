import { useState, useCallback } from 'react';
import { 
  MIN_SCALE, 
  MAX_SCALE, 
  SCALE_STEP, 
  DEFAULT_SCALE 
} from '../../utils/constants';

export const useTimelineZoom = (initialScale = DEFAULT_SCALE) => {
  const [scale, setScale] = useState(initialScale);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []); // No dependencies needed

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []); // No dependencies needed

  const handleZoomReset = useCallback(() => {
    setScale(initialScale);
  }, [initialScale]); // initialScale is a dependency because it's a hook parameter

  return { scale, handleZoomIn, handleZoomOut, handleZoomReset };
};