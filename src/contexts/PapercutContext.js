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
  const [lastInsertedSegmentId, setLastInsertedSegmentId] = useState(null);

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

  const addContentToPapercut = useCallback((papercutId, content) => {
    setPapercuts(prev => {
      const papercut = prev.find(p => p.id === papercutId);
      if (!papercut) return prev;

      const lastAddedSegment = content[content.length - 1];
      if (lastAddedSegment) {
        setLastInsertedSegmentId(lastAddedSegment.id);
        // Set cursor to last word of last added segment
        const lastWord = lastAddedSegment.words[lastAddedSegment.words.length - 1];
        setCursorPosition({
          segmentId: lastAddedSegment.id,
          wordId: lastWord.id
        });
      }

      return prev.map(p => {
        if (p.id === papercutId) {
          return {
            ...p,
            content: [...p.content, ...content]
          };
        }
        return p;
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
      activeTab,
      setActiveTab,
      cursorPosition,
      lastInsertedSegmentId,
      updateCursorPosition,
      updatePapercutContent,
      addContentToPapercut,
      insertContentToPapercut,
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