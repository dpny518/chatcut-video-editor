// TranscriptContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const TranscriptContext = createContext(undefined);

export const TranscriptProvider = ({ children }) => {
  const [highlightedWord, setHighlightedWord] = useState(null);
  const [displayContent, setDisplayContent] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);

  const findInSource = useCallback((word, fileId) => {
    // This will trigger the highlight and scroll in TranscriptContent
    setHighlightedWord({ ...word, fileId });
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedWord(null);
  }, []);

  const value = {
    highlightedWord,
    findInSource,
    clearHighlight,
    displayContent,
    setDisplayContent,
    selectedSegments,
    setSelectedSegments
  };

  return (
    <TranscriptContext.Provider value={value}>
      {children}
    </TranscriptContext.Provider>
  );
};

export const useTranscript = () => {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error('useTranscript must be used within TranscriptProvider');
  }
  return context;
};