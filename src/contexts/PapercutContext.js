import React, { createContext, useContext, useState, useCallback } from 'react';

const PapercutContext = createContext();

const createInitialPapercut = () => ({
  id: `papercut-${Date.now()}`, // Make unique using timestamp
  name: 'Papercut 1',
  content: [],
  created: new Date(),
  modified: new Date()
});

export function PapercutProvider({ children }) {
  const [papercuts, setPapercuts] = useState([createInitialPapercut()]);
  const [activeTab, setActiveTab] = useState('papercut-default');
  const [cursorPosition, setCursorPosition] = useState(null);

  const addContentToPapercut = useCallback((papercutId, newContent) => {
    console.log('Adding content to papercut:', papercutId, newContent);
    setPapercuts(prevPapercuts => {
      return prevPapercuts.map(papercut => {
        if (papercut.id === papercutId) {
          return {
            ...papercut,
            content: [...papercut.content, ...newContent]
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

  const updateCursorPosition = useCallback((newPosition) => {
    setCursorPosition(newPosition);
  }, []);

  const createNewPapercut = useCallback(() => {
    const newPapercut = {
      id: `papercut-${Date.now()}`,
      name: `Papercut ${papercuts.length + 1}`,
      content: [],
      created: new Date(),
      modified: new Date()
    };
  
    setPapercuts(prev => [...prev, newPapercut]);
    setActiveTab(newPapercut.id); // Automatically switch to new papercut
    return newPapercut.id;
  }, [papercuts]);

  return (
    <PapercutContext.Provider value={{
      papercuts,
      addContentToPapercut,
      activeTab,
      setActiveTab,
      insertContentToPapercut,
      cursorPosition,
      updateCursorPosition,
      createNewPapercut
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