// src/utils/ClipSegmentManager.js
export const ClipSegmentManager = {
    getSourceTime: (globalTime, segments) => {
      let accumulatedTime = 0;
      for (const segment of segments) {
        const segmentDuration = segment.endTime - segment.startTime;
        if (globalTime >= accumulatedTime && globalTime < accumulatedTime + segmentDuration) {
          return {
            clip: segment.sourceClip,
            time: segment.startTime + (globalTime - accumulatedTime),
            segmentIndex: segments.indexOf(segment)
          };
        }
        accumulatedTime += segmentDuration;
      }
      return null;
    },
  
    getGlobalTime: (sourceClip, sourceTime, segments) => {
      let accumulatedTime = 0;
      for (const segment of segments) {
        if (segment.sourceClip.id === sourceClip.id) {
          if (sourceTime >= segment.startTime && sourceTime <= segment.endTime) {
            return accumulatedTime + (sourceTime - segment.startTime);
          }
        }
        accumulatedTime += segment.endTime - segment.startTime;
      }
      return null;
    },
  
    getTotalDuration: (segments) => {
      return segments.reduce((total, segment) => 
        total + (segment.endTime - segment.startTime), 0
      );
    },
  
    getNextSegment: (currentSegmentIndex, segments) => {
      if (currentSegmentIndex < segments.length - 1) {
        return {
          segment: segments[currentSegmentIndex + 1],
          index: currentSegmentIndex + 1
        };
      }
      return null;
    }
  };