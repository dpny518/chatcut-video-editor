import { v4 as uuidv4 } from 'uuid';

/**
 * Timeline Service
 * Handles core timeline operations and state management
 */

/**
 * Creates initial metadata for a new clip
 */
const createClipMetadata = ({
  sourceType,
  sourceId,
  startTime,
  endTime,
  position,
  track,
  file,
  name
}) => ({
  id: `clip-${uuidv4()}`,
  source: {
    type: sourceType,
    id: sourceId,
    startTime,
    endTime,
    duration: endTime - startTime
  },
  timeline: {
    start: position,
    end: position + (endTime - startTime),
    track: track || 0
  },
  metadata: {
    name: name || `Clip ${Date.now()}`,
    created: Date.now(),
    modified: Date.now(),
    file: sourceType === 'bin' ? file : undefined,
    reference: sourceType === 'timeline' ? {
      timelineId: sourceId
    } : undefined
  }
});

/**
 * Adds a clip to a timeline
 */
export const addClipToTimeline = ({
  sourceType,
  sourceId,
  targetTimelineId,
  startTime,
  endTime,
  position = 0,
  track = 0,
  file,
  name,
  references,
  timelineData
}) => {
  try {
    // Validate input
    if (!targetTimelineId || !timelineData[targetTimelineId]) {
      throw new Error('Invalid target timeline');
    }

    if (startTime >= endTime) {
      throw new Error('Invalid time range');
    }

    if (sourceType === 'timeline') {
      if (!timelineData[sourceId]) {
        throw new Error('Source timeline not found');
      }
      if (references?.hasCircularReference?.(sourceId, targetTimelineId)) {
        throw new Error('Operation would create circular reference');
      }
    }

    // Create clip metadata
    const clipMetadata = createClipMetadata({
      sourceType,
      sourceId,
      startTime,
      endTime,
      position,
      track,
      file,
      name
    });

    // Update timeline
    const updatedTimeline = {
      ...timelineData[targetTimelineId],
      clips: [
        ...timelineData[targetTimelineId].clips,
        clipMetadata
      ],
      modified: Date.now()
    };

    // Update references if needed
    if (sourceType === 'timeline' && references) {
      references.addReference({
        sourceId,
        targetTimelineId,
        clipId: clipMetadata.id
      });
    }

    return {
      success: true,
      clip: clipMetadata,
      timeline: updatedTimeline
    };
  } catch (error) {
    console.error('Error adding clip to timeline:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Moves a clip between timelines
 */
export const moveClipBetweenTimelines = ({
  clipId,
  sourceTimelineId,
  targetTimelineId,
  position,
  track,
  timelineData,
  references
}) => {
  try {
    // Validate input
    if (!timelineData[sourceTimelineId] || !timelineData[targetTimelineId]) {
      throw new Error('Invalid timeline IDs');
    }

    // Find clip in source timeline
    const sourceClip = timelineData[sourceTimelineId].clips
      .find(clip => clip.id === clipId);

    if (!sourceClip) {
      throw new Error('Clip not found in source timeline');
    }

    // Check for circular references
    if (sourceClip.source.type === 'timeline' && 
        references?.hasCircularReference?.(sourceClip.source.id, targetTimelineId)) {
      throw new Error('Move would create circular reference');
    }

    // Create updated clip metadata
    const updatedClip = {
      ...sourceClip,
      timeline: {
        ...sourceClip.timeline,
        start: position,
        end: position + (sourceClip.source.endTime - sourceClip.source.startTime),
        track: track || 0
      },
      metadata: {
        ...sourceClip.metadata,
        modified: Date.now()
      }
    };

    // Update timelines
    const updatedSourceTimeline = {
      ...timelineData[sourceTimelineId],
      clips: timelineData[sourceTimelineId].clips
        .filter(clip => clip.id !== clipId),
      modified: Date.now()
    };

    const updatedTargetTimeline = {
      ...timelineData[targetTimelineId],
      clips: [
        ...timelineData[targetTimelineId].clips,
        updatedClip
      ],
      modified: Date.now()
    };

    // Update references if needed
    if (sourceClip.source.type === 'timeline' && references) {
      references.updateReference({
        clipId,
        oldTimelineId: sourceTimelineId,
        newTimelineId: targetTimelineId
      });
    }

    return {
      success: true,
      clip: updatedClip,
      source: updatedSourceTimeline,
      target: updatedTargetTimeline
    };
  } catch (error) {
    console.error('Error moving clip between timelines:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Trims a clip in a timeline
 */
export const trimClip = ({
  timelineId,
  clipId,
  newStart,
  newEnd,
  timelineData
}) => {
  try {
    const timeline = timelineData[timelineId];
    if (!timeline) {
      throw new Error('Timeline not found');
    }

    const clipIndex = timeline.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) {
      throw new Error('Clip not found');
    }

    const clip = timeline.clips[clipIndex];
    
    // Validate new time range
    if (newStart >= newEnd) {
      throw new Error('Invalid time range');
    }

    // Create updated clip
    const updatedClip = {
      ...clip,
      source: {
        ...clip.source,
        startTime: newStart,
        endTime: newEnd,
        duration: newEnd - newStart
      },
      timeline: {
        ...clip.timeline,
        end: clip.timeline.start + (newEnd - newStart)
      },
      metadata: {
        ...clip.metadata,
        modified: Date.now()
      }
    };

    // Update timeline
    const updatedTimeline = {
      ...timeline,
      clips: [
        ...timeline.clips.slice(0, clipIndex),
        updatedClip,
        ...timeline.clips.slice(clipIndex + 1)
      ],
      modified: Date.now()
    };

    return {
      success: true,
      clip: updatedClip,
      timeline: updatedTimeline
    };
  } catch (error) {
    console.error('Error trimming clip:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Splits a clip at a specific time
 */
export const splitClip = ({
  timelineId,
  clipId,
  splitTime,
  timelineData
}) => {
  try {
    const timeline = timelineData[timelineId];
    if (!timeline) {
      throw new Error('Timeline not found');
    }

    const clip = timeline.clips.find(c => c.id === clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    // Validate split time
    if (splitTime <= clip.source.startTime || 
        splitTime >= clip.source.endTime) {
      throw new Error('Invalid split time');
    }

    // Create two new clips
    const firstClip = {
      ...createClipMetadata({
        sourceType: clip.source.type,
        sourceId: clip.source.id,
        startTime: clip.source.startTime,
        endTime: splitTime,
        position: clip.timeline.start,
        track: clip.timeline.track,
        file: clip.metadata.file,
        name: `${clip.metadata.name} (1)`
      })
    };

    const secondClip = {
      ...createClipMetadata({
        sourceType: clip.source.type,
        sourceId: clip.source.id,
        startTime: splitTime,
        endTime: clip.source.endTime,
        position: clip.timeline.start + (splitTime - clip.source.startTime),
        track: clip.timeline.track,
        file: clip.metadata.file,
        name: `${clip.metadata.name} (2)`
      })
    };

    // Update timeline
    const updatedTimeline = {
      ...timeline,
      clips: [
        ...timeline.clips.filter(c => c.id !== clipId),
        firstClip,
        secondClip
      ],
      modified: Date.now()
    };

    return {
      success: true,
      clips: [firstClip, secondClip],
      timeline: updatedTimeline
    };
  } catch (error) {
    console.error('Error splitting clip:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Merges consecutive clips in a timeline
 */
export const mergeClips = ({
  timelineId,
  clipIds,
  timelineData
}) => {
  try {
    const timeline = timelineData[timelineId];
    if (!timeline) {
      throw new Error('Timeline not found');
    }

    const clips = clipIds
      .map(id => timeline.clips.find(c => c.id === id))
      .filter(Boolean);

    if (clips.length < 2) {
      throw new Error('Need at least two clips to merge');
    }

    // Validate clips are consecutive and on same track
    clips.sort((a, b) => a.timeline.start - b.timeline.start);
    
    for (let i = 0; i < clips.length - 1; i++) {
      if (clips[i].timeline.track !== clips[i + 1].timeline.track ||
          Math.abs(clips[i].timeline.end - clips[i + 1].timeline.start) > 0.001) {
        throw new Error('Clips must be consecutive and on same track');
      }
    }

    // Create merged clip
    const mergedClip = {
      ...createClipMetadata({
        sourceType: clips[0].source.type,
        sourceId: clips[0].source.id,
        startTime: clips[0].source.startTime,
        endTime: clips[clips.length - 1].source.endTime,
        position: clips[0].timeline.start,
        track: clips[0].timeline.track,
        file: clips[0].metadata.file,
        name: `Merged Clip`
      })
    };

    // Update timeline
    const updatedTimeline = {
      ...timeline,
      clips: [
        ...timeline.clips.filter(c => !clipIds.includes(c.id)),
        mergedClip
      ],
      modified: Date.now()
    };

    return {
      success: true,
      clip: mergedClip,
      timeline: updatedTimeline
    };
  } catch (error) {
    console.error('Error merging clips:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  addClipToTimeline,
  moveClipBetweenTimelines,
  trimClip,
  splitClip,
  mergeClips
};