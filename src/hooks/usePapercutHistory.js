import { useContext, useCallback } from 'react';
import { debounce } from 'lodash';
import { PapercutHistoryContext } from '../contexts/PapercutHistoryContext';

const DEBOUNCE_DELAY = 1000;

export const usePapercutHistory = () => {
  const context = useContext(PapercutHistoryContext);
  if (!context) {
    throw new Error('usePapercutHistory must be used within PapercutHistoryProvider');
  }

  const [state, dispatch] = context;
  
  const debouncedPushState = useCallback(
    debounce((newState) => {
      dispatch({ type: 'PUSH_STATE', payload: newState });
    }, DEBOUNCE_DELAY),
    []
  );

  const pushState = useCallback((newState) => {
    debouncedPushState(newState);
  }, [debouncedPushState]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, [dispatch]);

  const restoreHistory = useCallback((history) => {
    dispatch({ type: 'RESTORE_HISTORY', payload: history });
  }, [dispatch]);

  return {
    currentState: state.present,
    pushState,
    undo,
    redo, 
    clearHistory,
    restoreHistory,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
};