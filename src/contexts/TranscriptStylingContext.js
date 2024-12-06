import React, { createContext, useContext, useState } from 'react';

const TranscriptStylingContext = createContext();

export const TranscriptStylingProvider = ({ children }) => {
  const [styledWords, setStyledWords] = useState({});

  const addStyle = (selectedContent, style) => {
    setStyledWords(prev => {
      const newStyles = { ...prev };
      selectedContent.forEach(content => {
        content.words.forEach(word => {
          newStyles[word.id] = style;
        });
      });
      return newStyles;
    });
  };

  const removeStyle = (selectedContent) => {
    setStyledWords(prev => {
      const newStyles = { ...prev };
      selectedContent.forEach(content => {
        content.words.forEach(word => {
          delete newStyles[word.id]; // Remove any style associated with the word
        });
      });
      return newStyles;
    });
  };
  

  const getWordStyle = (wordId) => {
    return styledWords[wordId];
  };

  return (
    <TranscriptStylingContext.Provider value={{
      addStyle,
      removeStyle,
      getWordStyle,
      styledWords // Exposing styledWords state for debugging if needed
    }}>
      {children}
    </TranscriptStylingContext.Provider>
  );
};

export const useTranscriptStyling = () => {
  const context = useContext(TranscriptStylingContext);
  if (!context) {
    throw new Error('useTranscriptStyling must be used within a TranscriptStylingProvider');
  }
  return context;
};