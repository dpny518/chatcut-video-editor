import React, { createContext, useContext, useState, useCallback } from 'react';

const TranscriptClipboardContext = createContext(undefined);

export const TranscriptClipboardProvider = ({ children }) => {
  const [clipboardContent, setClipboardContent] = useState(null);

  const storeInClipboard = useCallback((content) => {
    setClipboardContent(content);
  }, []);

  const getFromClipboard = useCallback(() => {
    return clipboardContent;
  }, [clipboardContent]);

  const value = {
    storeInClipboard,
    getFromClipboard
  };

  return (
    <TranscriptClipboardContext.Provider value={value}>
      {children}
    </TranscriptClipboardContext.Provider>
  );
};

export const useTranscriptClipboard = (getSelectedContent) => {
  const context = useContext(TranscriptClipboardContext);
  if (!context) {
    throw new Error('useTranscriptClipboard must be used within a TranscriptClipboardProvider');
  }

  const copyToClipboard = useCallback(async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent || selectedContent.length === 0) return false;

    try {
      context.storeInClipboard(selectedContent);
      
      // Also store as plain text in system clipboard
      const plainText = selectedContent
        .map(segment => `${segment.speaker}: ${segment.words.map(w => w.word || w.text).join(' ')}`)
        .join('\n');

      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }, [getSelectedContent, context]);

  const pasteFromClipboard = useCallback((callback) => {
    const clipboardContent = context.getFromClipboard();
    if (clipboardContent) {
      callback(clipboardContent);
      return true;
    }
    return false;
  }, [context]);

  return { copyToClipboard, pasteFromClipboard };
};