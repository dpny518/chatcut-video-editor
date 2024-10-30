//src/hooks/useTimeline/useTimeContextMenu

import { useState, useCallback } from 'react';

export const useTimelineContextMenu = (onClipSelect) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState(null);

  const handleContextMenu = useCallback((e, action) => {
    console.log('Context Menu:', { action });
    
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedActionId(action.id);
    onClipSelect?.(action.id);
  }, [onClipSelect]);

  return {
    contextMenu,
    selectedActionId,
    setContextMenu,
    setSelectedActionId,
    handleContextMenu
  };
};