import React, { createContext, useContext, useState, useCallback } from 'react';
import { useEditorColors } from '../hooks/useEditorColors';

const SpeakerColorContext = createContext();

export function SpeakerColorProvider({ children }) {
  const [speakerColors] = useState(new Map());
  const { generateColorForSpeaker } = useEditorColors();

  const getSpeakerColor = useCallback((speaker) => {
    if (!speakerColors.has(speaker)) {
      const speakerIndex = speakerColors.size;
      const colors = generateColorForSpeaker(speakerIndex);
      const speakerColor = { speaker, colors };
      speakerColors.set(speaker, speakerColor);
    }
    return speakerColors.get(speaker);
  }, [generateColorForSpeaker, speakerColors]);

  const value = {
    speakerColors,
    getSpeakerColor
  };

  return (
    <SpeakerColorContext.Provider value={value}>
      {children}
    </SpeakerColorContext.Provider>
  );
}

export function useSpeakerColors() {
  const context = useContext(SpeakerColorContext);
  if (context === undefined) {
    throw new Error('useSpeakerColors must be used within a SpeakerColorProvider');
  }
  return context;
}