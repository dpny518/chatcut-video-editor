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
    console.log('RemoveStyle received:', selectedContent);
    setStyledWords(prev => {
      console.log('Previous styles:', prev);
      const newStyles = { ...prev };
      selectedContent.forEach(content => {
        console.log('Processing content:', content);
        content.words.forEach(word => {
          console.log('Removing style for word:', word.id);
          delete newStyles[word.id];
        });
      });
      console.log('New styles after removal:', newStyles);
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
      getWordStyle
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