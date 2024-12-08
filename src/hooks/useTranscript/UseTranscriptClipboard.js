import { useCallback, useState, createContext, useContext } from 'react';

const TranscriptClipboardContext = createContext(undefined);

export const TranscriptClipboardProvider = ({ children }) => {
  const [clipboardContent, setClipboardContent] = useState(null);

  const value = {
    clipboardContent,
    setClipboardContent
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
  const { clipboardContent, setClipboardContent } = context;

  const copyToClipboard = useCallback(async () => {
    const selectedContent = getSelectedContent();
    if (!selectedContent || selectedContent.length === 0) return false;

    try {
      // Store the exact content that getSelectedContent returns
      setClipboardContent(selectedContent);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }, [getSelectedContent, setClipboardContent]);

  const pasteFromClipboard = useCallback(async (callback) => {
    if (clipboardContent) {
      // Pass the stored content directly to the callback
      callback(clipboardContent);
      return true;
    }
    return false;
  }, [clipboardContent]);

  return { copyToClipboard, pasteFromClipboard };
};