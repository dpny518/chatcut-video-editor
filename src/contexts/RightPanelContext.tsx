// src/contexts/RightPanelContext.tsx
'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'
import { CopiedWord } from './CopyContext'

export interface TabMetadata {
  pastePosition: number;
  words: CopiedWord[];
}

interface Tab {
  id: string;
  name: string;
  content: string;
  metadata: TabMetadata[];
}

interface RightPanelContextType {
  tabs: Tab[]
  activeTabId: string
  addTab: () => void
  renameTab: (tabId: string, newName: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, newContent: { text: string, metadata: TabMetadata[] }) => void
}

const RightPanelContext = createContext<RightPanelContextType | undefined>(undefined)

export const RightPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', name: 'Tab 1', content: '', metadata: [] }])
  const [activeTabId, setActiveTabId] = useState('1')

  const addTab = useCallback(() => {
    const newTab = { id: Date.now().toString(), name: `Tab ${tabs.length + 1}`, content: '', metadata: [] }
    setTabs(prevTabs => [...prevTabs, newTab])
    setActiveTabId(newTab.id)
  }, [tabs])

  const renameTab = useCallback((tabId: string, newName: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ))
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

const updateTabContent = useCallback((tabId: string, newContent: { text: string, metadata: TabMetadata[] }) => {
  setTabs(prevTabs => {
    const updatedTabs = prevTabs.map(tab => 
      tab.id === tabId ? { ...tab, content: newContent.text, metadata: newContent.metadata } : tab
    );
    console.log('Updated tabs:', updatedTabs);
    return updatedTabs;
  });
}, []);

  return (
    <RightPanelContext.Provider value={{ tabs, activeTabId, addTab, renameTab, setActiveTab, updateTabContent }}>
      {children}
    </RightPanelContext.Provider>
  )
}

export const useRightPanel = () => {
  const context = useContext(RightPanelContext)
  if (!context) {
    throw new Error('useRightPanel must be used within a RightPanelProvider')
  }
  return context
}