//src/utils/recalculateTimelineState.js
export const recalculateTimelineState = (clipsArray) => {
  const rowsMap = new Map();
  
  clipsArray.forEach(clip => {
    const rowIndex = clip.metadata.timeline.row;
    if (!rowsMap.has(rowIndex)) {
      rowsMap.set(rowIndex, []);
    }
    rowsMap.get(rowIndex).push(clip);
  });

  rowsMap.forEach((rowClips, rowIndex) => {
    rowClips.sort((a, b) => a.metadata.timeline.start - b.metadata.timeline.start);
    
    let currentPosition = 0;
    rowClips.forEach(clip => {
      clip.metadata.timeline = {
        ...clip.metadata.timeline,
        start: currentPosition,
        end: currentPosition + clip.metadata.timeline.duration
      };
      currentPosition = clip.metadata.timeline.end;
    });
  });

  return Array.from(rowsMap.values()).flat();
};