export const createPapercutFromSelection = (selectedSegments, sourceContent) => {
    // Create a new papercut document
    const papercutId = `papercut-${Date.now()}`;
    
    const segments = selectedSegments.map(segment => {
      // Create unique IDs for the new segment
      const segmentId = `segment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Transform words to maintain source references
      const words = segment.words.map((word, index) => ({
        id: `word-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: word.word,
        start_time: word.start,
        end_time: word.end,
        sourceReference: {
          fileId: segment.fileId,
          segmentId: segment.globalIndex,
          wordIndex: index
        }
      }));
  
      return {
        id: segmentId,
        speaker: segment.speaker,
        words,
        sourceReference: {
          fileId: segment.fileId,
          segmentId: segment.globalIndex
        }
      };
    });
  
    return {
      id: papercutId,
      name: `Papercut ${new Date().toLocaleString()}`,
      segments,
      metadata: {
        sourceFiles: [...new Set(selectedSegments.map(s => s.fileId))],
        created: new Date(),
        modified: new Date(),
        editHistory: []
      }
    };
  };