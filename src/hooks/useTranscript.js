// hooks/useTranscript.js
import { useState, useCallback } from 'react';

export const useTranscript = () => {
  const [transcripts, setTranscripts] = useState(new Map());
  const [transcriptErrors, setTranscriptErrors] = useState(new Map());

  const loadTranscript = useCallback(async (file, videoFileName) => {
    try {
      // Clear any previous errors for this file
      setTranscriptErrors(prev => {
        const next = new Map(prev);
        next.delete(videoFileName);
        return next;
      });

      const text = await file.text();
      const data = JSON.parse(text);

      // Validate transcript structure
      if (!data.transcription) {
        throw new Error('Invalid transcript format');
      }

      setTranscripts(prev => new Map(prev).set(videoFileName, data));
      return true;
    } catch (error) {
      setTranscriptErrors(prev => new Map(prev).set(videoFileName, error.message));
      return false;
    }
  }, []);

  const getTranscript = useCallback((videoFileName) => {
    return transcripts.get(videoFileName);
  }, [transcripts]);

  const getTranscriptError = useCallback((videoFileName) => {
    return transcriptErrors.get(videoFileName);
  }, [transcriptErrors]);

  const clearTranscript = useCallback((videoFileName) => {
    setTranscripts(prev => {
      const next = new Map(prev);
      next.delete(videoFileName);
      return next;
    });
    setTranscriptErrors(prev => {
      const next = new Map(prev);
      next.delete(videoFileName);
      return next;
    });
  }, []);

  return {
    transcripts,
    transcriptErrors,
    loadTranscript,
    getTranscript,
    getTranscriptError,
    clearTranscript
  };
};