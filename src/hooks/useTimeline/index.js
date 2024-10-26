export { useTimelineData } from './useTimelineData';
export { useTimelineEffects } from './useTimelineEffects';
export { useTimelineStateManager } from './useTimelineStateManager';
export { useTimelineTransition } from './useTimelineTransition';
export { useTimelineManager } from './useTimelineManager';
export { useTimelineReferences } from './useTimelineReferences';
export { useTimelineValidation } from './useTimelineValidation';
export { useTimelineZoom } from './useTimelineZoom';

// Bundle them into an object for namespaced usage
export const useTimeline = {
  data: useTimelineData,
  effects: useTimelineEffects,
  stateManager: useTimelineStateManager,
  transition: useTimelineTransition,
  manager: useTimelineManager,
  references: useTimelineReferences,
  validation: useTimelineValidation,
  zoom: useTimelineZoom
};
