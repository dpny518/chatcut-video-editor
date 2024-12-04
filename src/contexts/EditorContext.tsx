// src/contexts/EditorContext.tsx

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { FileContent } from '../types/transcript'

interface EditorContextType {
  content: FileContent[];
  setContent: React.Dispatch<React.SetStateAction<FileContent[]>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<FileContent[]>([])

  const setContentWithLog = useCallback((newContent: React.SetStateAction<FileContent[]>) => {
    console.log('Setting new content:', newContent)
    setContent(newContent)
  }, [])

  return (
    <EditorContext.Provider value={{ 
      content, 
      setContent: setContentWithLog, 
    }}>
      {children}
    </EditorContext.Provider>
  )
}


export const useEditor = () => {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}