// src/hooks/useTimeline/index.js
import { useTimelineData } from './useTimelineData';
import { useTimelineEffects } from './useTimelineEffects';
import { useTimelineStateManager } from './useTimelineStateManager';
import { useTimelineTransition } from './useTimelineTransition';
import { useTimelineContextMenu } from './useTimelineContextMenu';
import { useTimelineHandlers } from './useTimelineHandlers';
import { useTimelineResize } from './useTimelineResize';
import { useTimelineZoom } from './useTimelineZoom';

// Individual exports
export { 
  useTimelineData,
  useTimelineEffects, 
  useTimelineStateManager,
  useTimelineTransition,
  useTimelineContextMenu,
  useTimelineHandlers,
  useTimelineResize,
  useTimelineZoom
};

// Namespaced exports
export const useTimeline = {
  data: useTimelineData,
  effects: useTimelineEffects,
  stateManager: useTimelineStateManager,
  transition: useTimelineTransition,
  contextMenu: useTimelineContextMenu,
  handlers: useTimelineHandlers,
  resize: useTimelineResize,
  zoom: useTimelineZoom
};