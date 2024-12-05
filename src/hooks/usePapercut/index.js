import { usePapercutActions } from './usePapercutActions';
import { usePapercutState } from './usePapercutState';

// We'll export both hooks individually and as a combined hook
export { usePapercutActions };
export { usePapercutState };

// Main hook that combines functionality
export function usePapercut() {
  const actions = usePapercutActions();
  const state = usePapercutState();

  return {
    ...actions,
    ...state
  };
}