// src/hooks/media/useTimelineManagement.js
import { useState, useCallback } from 'react';

export const useTimelineManagement = (timelineProjects) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');

  const getTimelines = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('timelineProjects') || '{}');
    } catch (error) {
      console.error('Error loading timelines:', error);
      return {};
    }
  }, []);

  const handleSaveClick = useCallback(() => {
    setSaveDialogOpen(true);
    setNewTimelineName(`Timeline ${new Date().toLocaleString()}`);
  }, []);

  const handleSaveConfirm = useCallback(() => {
    if (newTimelineName.trim()) {
      timelineProjects?.onSave?.(newTimelineName.trim());
      setSaveDialogOpen(false);
    }
  }, [newTimelineName, timelineProjects]);

  const handleTimelineContextMenu = useCallback((event, timeline) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      timeline
    });
  }, []);

  const handleContextClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteTimeline = useCallback(() => {
    if (contextMenu?.timeline) {
      timelineProjects?.onDelete?.(contextMenu.timeline);
      handleContextClose();
    }
  }, [contextMenu, timelineProjects, handleContextClose]);

  const handleLoadTimeline = useCallback(() => {
    if (contextMenu?.timeline) {
      timelineProjects?.onLoad?.(contextMenu.timeline);
      handleContextClose();
    }
  }, [contextMenu, timelineProjects, handleContextClose]);

  return {
    // State
    contextMenu,
    saveDialogOpen,
    newTimelineName,
    timelines: getTimelines(),
    
    // Handlers
    handleSaveClick,
    handleSaveConfirm,
    handleTimelineContextMenu,
    handleContextClose,
    handleDeleteTimeline,
    handleLoadTimeline,
    
    // Setters
    setNewTimelineName,
    setSaveDialogOpen
  };
};