import { useState, useCallback } from 'react';
import { usePapercuts } from '../../contexts/PapercutContext';

export function usePapercutState() {
  const { papercuts, activeTab } = usePapercuts();
  const [cursorPosition, setCursorPosition] = useState(null);

  const updateCursorPosition = useCallback((position) => {
    setCursorPosition(position);
  }, []);

  return {
    papercuts,
    activeTab,
    cursorPosition,
    updateCursorPosition
  };
}