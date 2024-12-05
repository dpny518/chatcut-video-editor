// src/hooks/useProcessTranscripts.js

import { useState, useEffect } from 'react';

const useProcessTranscripts = (transcripts) => {
  const [displayContent, setDisplayContent] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsProcessing(true);
    
    if (!transcripts.length) {
      setDisplayContent([]);
      setIsProcessing(false);
      return;
    }

    const processTranscripts = () => {
      let globalWordIndex = 0;
      return transcripts.map(transcript => {
        const content = JSON.parse(transcript.content);
        const fileContent = content.processed_data || content;
        
        if (!fileContent.transcript || !fileContent.transcript.segments) {
          console.log("Transcript missing segments:", transcript);
          return null;
        }

        const fileSegments = fileContent.transcript.segments.map((segment, segmentIndex) => {
          const processedWords = segment.words.map((word, wordIndex) => ({
            ...word,
            id: `${transcript.id}-${segmentIndex}-${wordIndex}`,
            globalIndex: globalWordIndex++,
            position: {
              segment: segmentIndex,
              word: wordIndex
            }
          }));

          return {
            ...segment,
            fileId: transcript.id,
            fileName: transcript.name,
            globalIndex: `${transcript.id}-${segmentIndex}`,
            words: processedWords,
            metadata: {
              ...segment.metadata,
              transcript: {
                fileId: transcript.id,
                fileName: transcript.name
              }
            }
          };
        });

        const groupedSegments = fileSegments.reduce((acc, segment) => {
          if (acc.length === 0 || acc[acc.length - 1][0].speaker !== segment.speaker) {
            acc.push([segment]);
          } else {
            acc[acc.length - 1].push(segment);
          }
          return acc;
        }, []);

        return {
          fileId: transcript.id,
          fileName: transcript.name,
          groupedSegments
        };
      }).filter(Boolean);
    };

    const processed = processTranscripts();
    setDisplayContent(processed);
    setIsProcessing(false);
  }, [transcripts]);

  return [displayContent, isProcessing];
};

export default useProcessTranscripts;