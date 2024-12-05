// PapercutContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const PapercutContext = createContext();

const createInitialPapercut = () => ({
  id: `papercut-${Date.now()}`,
  name: 'Papercut 1',
  content: [],
  created: new Date(),
  modified: new Date()
});

export function PapercutProvider({ children }) {
  const [papercuts, setPapercuts] = useState([createInitialPapercut()]);
  const [activeTab, setActiveTab] = useState('papercut-default');
  const [cursorPosition, setCursorPosition] = useState(null);

  const updateCursorPosition = useCallback((newPosition) => {
    setCursorPosition(newPosition);
  }, []);

  const updatePapercutContent = useCallback((papercutId, newContent) => {
    setPapercuts(prev => prev.map(papercut => {
      if (papercut.id === papercutId) {
        return {
          ...papercut,
          content: newContent,
          modified: new Date()
        };
      }
      return papercut;
    }));
  }, []);

  const addContentToPapercut = useCallback((papercutId, newContent) => {
    setPapercuts(prevPapercuts => {
      return prevPapercuts.map(papercut => {
        if (papercut.id === papercutId) {
          return {
            ...papercut,
            content: [...papercut.content, ...newContent],
            modified: new Date()
          };
        }
        return papercut;
      });
    });
  }, []);

  const insertContentToPapercut = useCallback((papercutId, newContent, position) => {
    setPapercuts(prev => prev.map(papercut => {
      if (papercut.id === papercutId) {
        const updatedContent = [
          ...papercut.content.slice(0, position),
          ...newContent,
          ...papercut.content.slice(position)
        ];
        return {
          ...papercut,
          content: updatedContent,
          modified: new Date()
        };
      }
      return papercut;
    }));
  }, []);

  return (
    <PapercutContext.Provider value={{
      papercuts,
      activeTab,
      setActiveTab,
      cursorPosition,
      updateCursorPosition,
      updatePapercutContent,
      addContentToPapercut,
      insertContentToPapercut
    }}>
      {children}
    </PapercutContext.Provider>
  );
}

export const usePapercuts = () => {
  const context = useContext(PapercutContext);
  if (!context) {
    throw new Error('usePapercuts must be used within PapercutProvider');
  }
  return context;
};