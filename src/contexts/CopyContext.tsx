import React, { createContext, useContext, useState } from 'react'

export interface CopiedWord {
  sourceFile: string;
  sourceSegmentIndex: number;
  sourceWordIndex: number;
  word: string;
}

export interface CopiedContent {
  text: string;
  words: CopiedWord[];
}

interface CopyContextType {
  copiedContent: CopiedContent | null;
  setCopiedContent: (content: CopiedContent | null) => void;
  clearCopiedContent: () => void;
}

const CopyContext = createContext<CopyContextType | undefined>(undefined)

export const CopyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [copiedContent, setCopiedContent] = useState<CopiedContent | null>(null)

  // Enhanced debug method for setting copied content
  const debugSetCopiedContent = (content: CopiedContent | null) => {
    console.group('📋 Copy Context Update');
    console.log('Previous Content:', copiedContent);
    console.log('New Content:', content);
    
    // Stack trace to understand where the update is coming from
    console.trace('Update Trace');
    
    setCopiedContent(content);
    
    console.groupEnd();
  }

  // Clear method with debugging
  const clearCopiedContent = () => {
    console.group('🧹 Clear Copied Content');
    console.log('Previous Content:', copiedContent);
    setCopiedContent(null);
    console.trace('Clear Trace');
    console.groupEnd();
  }

  return (
    <CopyContext.Provider value={{ 
      copiedContent, 
      setCopiedContent: debugSetCopiedContent, 
      clearCopiedContent 
    }}>
      {children}
    </CopyContext.Provider>
  )
}

export const useCopy = () => {
  const context = useContext(CopyContext)
  if (context === undefined) {
    throw new Error('useCopy must be used within a CopyProvider')
  }
  return context
}