// services/masterClip/useMasterClip.js
import { useState, useCallback, useMemo } from 'react';
import { MasterClipManager } from './MasterClipManager';

export const useMasterClip = () => {
  // Create singleton instance
  const manager = useMemo(() => new MasterClipManager(), []);
  const [version, setVersion] = useState(0); // For triggering rerenders

  // Wrap manager methods
  const addClip = useCallback((clip, transcript) => {
    manager.addClip(clip, transcript);
    setVersion(v => v + 1); // Force update
  }, [manager]);

  const getSelectedContent = useCallback((selectedIds) => {
    return manager.getSelectedRange(selectedIds);
  }, [manager]);

  const createTimelineClip = useCallback((start, end) => {
    return manager.createTimelineClip(start, end);
  }, [manager]);

  return {
    addClip,
    getSelectedContent,
    createTimelineClip,
    version // For deps arrays
  };
};