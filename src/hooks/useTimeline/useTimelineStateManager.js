import { useState, useCallback } from 'react';
import { produce, enableMapSet } from 'immer';

enableMapSet();

export const CLIP_STATES = {
  INITIAL: 'INITIAL',
  MOVING: 'MOVING',
  TRIMMING: 'TRIMMING',
  COMPLETED: 'COMPLETED'
};

class TimelineClipState {
  constructor(clip) {
    this.id = clip.id;
    
    this.fileInfo = {
      name: clip.file.name,
      size: clip.file.size,
      type: clip.file.type,
    };
    
    // Source media timing (original media timing - never changes)
    this.sourceStart = clip.source.startTime;
    this.sourceEnd = clip.source.endTime;
    this.sourceDuration = this.sourceEnd - this.sourceStart;
    
    // Timeline position (changes with moves/trims)
    this.timelineStart = clip.metadata.timeline.start;
    this.timelineEnd = clip.metadata.timeline.end; // Use the provided end time instead of calculating
    this.timelineDuration = this.timelineEnd - this.timelineStart;

    // Playback segment within source media (changes with trims)
    this.playbackStart = this.sourceStart;
    this.playbackEnd = this.sourceEnd;
    
    this.modifications = [];
    this.state = CLIP_STATES.INITIAL;
  }

  startModification(type) {
    this.state = type;
    this.modifications.push({
      type,
      timestamp: Date.now(),
      before: {
        timelineStart: this.timelineStart,
        timelineEnd: this.timelineEnd,
        playbackStart: this.playbackStart,
        playbackEnd: this.playbackEnd
      }
    });
    return this;
  }

  moveClip(newPosition) {
    // Calculate movement delta
    const moveDelta = newPosition - this.timelineStart;
    
    // Move timeline position, keeping duration constant
    this.timelineStart = newPosition;
    this.timelineEnd = newPosition + this.timelineDuration;
    
    // Playback timing stays the same since we're just moving
    // No changes to playbackStart/playbackEnd needed
    
    this.modifications[this.modifications.length - 1].current = {
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      playbackStart: this.playbackStart,
      playbackEnd: this.playbackEnd,
      moveDelta
    };
    
    return this;
  }

  trimClip(newStart, newEnd) {
    // Detect which end is being trimmed by looking at which value actually changed
    const startChanged = Math.abs(newStart - this.timelineStart) > 0.001;
    const endChanged = Math.abs(newEnd - this.timelineEnd) > 0.001;
    
    if (startChanged && !endChanged) {
      // Left trim - start changed, end stayed same
      const trimRatio = (newStart - this.timelineStart) / this.timelineDuration;
      const playbackDuration = this.playbackEnd - this.playbackStart;
      this.playbackStart = Math.max(this.sourceStart, this.playbackStart + (trimRatio * playbackDuration));
      this.timelineStart = newStart;
    } else if (!startChanged && endChanged) {
      // Right trim - end changed, start stayed same
      const trimRatio = (newEnd - this.timelineEnd) / this.timelineDuration;
      const playbackDuration = this.playbackEnd - this.playbackStart;
      this.playbackEnd = Math.min(this.sourceEnd, this.playbackEnd + (trimRatio * playbackDuration));
      this.timelineEnd = newEnd;
    }
    
    // Update duration
    this.timelineDuration = this.timelineEnd - this.timelineStart;
    
    this.modifications[this.modifications.length - 1].current = {
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      playbackStart: this.playbackStart,
      playbackEnd: this.playbackEnd,
      isLeftTrim: startChanged
    };
    
    return this;
  }

  completeModification() {
    const lastMod = this.modifications[this.modifications.length - 1];
    lastMod.completed = Date.now();
    this.state = CLIP_STATES.COMPLETED;
    return this;
  }

  undo() {
    const lastMod = this.modifications.pop();
    if (lastMod) {
      this.timelineStart = lastMod.before.timelineStart;
      this.timelineEnd = lastMod.before.timelineEnd;
      this.playbackStart = lastMod.before.playbackStart;
      this.playbackEnd = lastMod.before.playbackEnd;
      this.timelineDuration = this.timelineEnd - this.timelineStart;
    }
    this.state = CLIP_STATES.COMPLETED;
    return this;
  }

  getTimingInfo() {
    return {
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      playbackStart: this.playbackStart,
      playbackEnd: this.playbackEnd,
      sourceStart: this.sourceStart,
      sourceEnd: this.sourceEnd,
      duration: this.timelineEnd - this.timelineStart
    };
  }
}

class TimelineStateManager {
  constructor() {
    this.clips = new Map();
    this.history = [];
    this.currentOperation = null;
  }

  updateClip(clip) {
    const clipState = this.clips.get(clip.id) || new TimelineClipState(clip);
    this.clips.set(clip.id, clipState);
    return clipState;
  }

  startClipModification(clipId, modificationType) {
    const clipState = this.clips.get(clipId);
    if (clipState) {
      const updatedState = produce(clipState, draft => {
        draft.startModification(modificationType);
      });
      this.clips.set(clipId, updatedState);
      this.currentOperation = { clipId, type: modificationType };
      return updatedState;
    }
    return null;
  }

  moveClip(clipId, newPosition) {
    const clipState = this.clips.get(clipId);
    if (clipState && this.currentOperation?.clipId === clipId) {
      const updatedState = produce(clipState, draft => {
        draft.moveClip(newPosition);
      });
      this.clips.set(clipId, updatedState);
      return updatedState;
    }
    return null;
  }

  trimClip(clipId, newStart, newEnd) {
    const clipState = this.clips.get(clipId);
    if (clipState && this.currentOperation?.clipId === clipId) {
      const updatedState = produce(clipState, draft => {
        draft.trimClip(newStart, newEnd);
      });
      this.clips.set(clipId, updatedState);
      return updatedState;
    }
    return null;
  }

  completeModification(clipId) {
    const clipState = this.clips.get(clipId);
    if (clipState && this.currentOperation?.clipId === clipId) {
      const updatedState = produce(clipState, draft => {
        draft.completeModification();
      });
      this.clips.set(clipId, updatedState);
      this.history.push({ ...this.currentOperation, timestamp: Date.now() });
      this.currentOperation = null;
      return updatedState;
    }
    return null;
  }

  undoClipModification(clipId) {
    const clipState = this.clips.get(clipId);
    if (clipState) {
      const updatedState = produce(clipState, draft => {
        draft.undo();
      });
      this.clips.set(clipId, updatedState);
      return updatedState;
    }
    return null;
  }

  getAllClipsState() {
    return Array.from(this.clips.values()).map(clip => ({
      id: clip.id,
      ...clip.getTimingInfo()
    }));
  }
}

// Create singleton instance
export const timelineManager = new TimelineStateManager();

// Hook implementation remains the same
export const useTimelineStateManager = () => {
  const [, forceUpdate] = useState({});

  const updateClip = useCallback((clip) => {
    const result = timelineManager.updateClip(clip);
    forceUpdate({});
    return result;
  }, []);


  const startClipModification = useCallback((clipId, modificationType) => {
    const result = timelineManager.startClipModification(clipId, modificationType);
    forceUpdate({});
    return result;
  }, []);

  const moveClip = useCallback((clipId, newPosition) => {
    const result = timelineManager.moveClip(clipId, newPosition);
    forceUpdate({});
    return result;
  }, []);

  const trimClip = useCallback((clipId, newStart, newEnd) => {
    const result = timelineManager.trimClip(clipId, newStart, newEnd);
    forceUpdate({});
    return result;
  }, []);

  const completeModification = useCallback((clipId) => {
    const result = timelineManager.completeModification(clipId);
    forceUpdate({});
    return result;
  }, []);

  const undoClipModification = useCallback((clipId) => {
    const result = timelineManager.undoClipModification(clipId);
    forceUpdate({});
    return result;
  }, []);

  return {
    manager: timelineManager,
    updateClip,
    startClipModification,
    moveClip,
    trimClip,
    completeModification,
    undoClipModification,
    getAllClipsState: timelineManager.getAllClipsState.bind(timelineManager)
  };
};