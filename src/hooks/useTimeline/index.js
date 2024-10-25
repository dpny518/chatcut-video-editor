export { useTimelineData } from './useTimelineData';
export { useTimelineEffects } from './useTimelineEffects';
export { useTimelineStateManager } from './useTimelineStateManager';
export { useTimelineTransition } from './useTimelineTransition';

// You can also bundle them into an object if you want to namespace them
export const useTimeline = {
  data: useTimelineData,
  effects: useTimelineEffects,
  stateManager: useTimelineStateManager,
  transition: useTimelineTransition
};