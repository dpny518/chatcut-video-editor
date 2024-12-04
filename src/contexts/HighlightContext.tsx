// src/contexts/HighlightContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export type HighlightType = 'green' | 'red';

// src/contexts/HighlightContext.tsx

export interface Highlight {
  fileId: string;
  segmentId: string;
  startWordIndex: number;
  endWordIndex: number;
  text: string;
  type: HighlightType;
}

interface HighlightContextType {
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (fileId: string, segmentId: string, startWordIndex: number, endWordIndex: number) => void;
}

const createHighlightContext = () => createContext<HighlightContextType | undefined>(undefined);

export const GreenHighlightContext = createHighlightContext();
export const RedHighlightContext = createHighlightContext();

const createHighlightProvider = (Context: React.Context<HighlightContextType | undefined>, type: HighlightType) => {
  return ({ children }: { children: React.ReactNode }) => {
    const [highlights, setHighlights] = useState<Highlight[]>([]);

      const addHighlight = useCallback((highlight: Highlight) => {
        setHighlights(prev => {
          console.log(`Previous ${type} highlights:`, prev);
          console.log(`Adding ${type} highlight:`, highlight);
          const newHighlights = [...prev, highlight];
          console.log(`New ${type} highlights:`, newHighlights);
          return newHighlights;
        });
      }, []);

    const removeHighlight = useCallback((fileId: string, segmentId: string, startWordIndex: number, endWordIndex: number) => {
      setHighlights(prev => 
        prev.filter(h => 
          h.fileId !== fileId || 
          h.segmentId !== segmentId || 
          h.startWordIndex !== startWordIndex || 
          h.endWordIndex !== endWordIndex
        )
      );
    }, []);

    return (
      <Context.Provider value={{ highlights, addHighlight, removeHighlight }}>
        {children}
      </Context.Provider>
    );
  };
};

export const GreenHighlightProvider = createHighlightProvider(GreenHighlightContext, 'green');
export const RedHighlightProvider = createHighlightProvider(RedHighlightContext, 'red');

export const useGreenHighlight = () => {
  const context = useContext(GreenHighlightContext);
  if (context === undefined) {
    throw new Error('useGreenHighlight must be used within a GreenHighlightProvider');
  }
  return context;
};

export const useRedHighlight = () => {
  const context = useContext(RedHighlightContext);
  if (context === undefined) {
    throw new Error('useRedHighlight must be used within a RedHighlightProvider');
  }
  return context;
};

