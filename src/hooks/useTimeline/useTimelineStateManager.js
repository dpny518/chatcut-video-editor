// src/hooks/useTimeline/useTimelineStateManager.js
import { useState, useCallback } from 'react';
import { produce, enableMapSet, immerable } from 'immer';

// Enable Immer support for Map and Set
enableMapSet();

export const CLIP_STATES = {
  INITIAL: 'INITIAL',
  MOVING: 'MOVING',
  TRIMMING: 'TRIMMING',
  COMPLETED: 'COMPLETED'
};

class TimelineClipState {
  // Make this class immerable
  [immerable] = true;

  constructor(clip) {
    this.id = clip.id;
    this.file = clip.file;
    this.name = clip.file.name;
    
    // Convert file to a plain object to make it immerable
    this.fileInfo = {
      name: clip.file.name,
      size: clip.file.size,
      type: clip.file.type,
    };
    
    // Original source timing
    this.sourceStartTime = clip.startTime || 0;
    this.sourceEndTime = clip.endTime || 0;
    this.sourceDuration = this.sourceEndTime - this.sourceStartTime;
    
    // Timeline positioning
    this.timelineStartTime = 0;
    this.timelineDuration = this.sourceDuration;
    this.timelineEndTime = this.timelineStartTime + this.timelineDuration;
    
    // Current working state
    this.currentStartTime = this.sourceStartTime;
    this.currentEndTime = this.sourceEndTime;
    this.currentDuration = this.sourceDuration;
    
    // Track modifications
    this.modifications = [];
    this.state = CLIP_STATES.INITIAL;
  }

  startModification(type) {
    this.state = type;
    this.modifications.push({
      type,
      timestamp: Date.now(),
      before: {
        startTime: this.currentStartTime,
        endTime: this.currentEndTime,
        timelinePosition: this.timelineStartTime
      }
    });
    return this;
  }

  moveClip(newTimelinePosition) {
    const delta = newTimelinePosition - this.timelineStartTime;
    this.timelineStartTime = newTimelinePosition;
    this.timelineEndTime = newTimelinePosition + this.timelineDuration;
    
    this.modifications[this.modifications.length - 1].current = {
      startTime: this.currentStartTime,
      endTime: this.currentEndTime,
      timelinePosition: newTimelinePosition,
      delta
    };
    return this;
  }

  trimClip(newStart, newEnd) {
    const originalDuration = this.sourceEndTime - this.sourceStartTime;
    const newDuration = newEnd - newStart;
    const timeScale = originalDuration / newDuration;

    const sourceOffset = (newStart - this.timelineStartTime) * timeScale;
    this.currentStartTime = this.sourceStartTime + sourceOffset;
    this.currentEndTime = this.currentStartTime + (newDuration * timeScale);
    
    this.timelineStartTime = newStart;
    this.timelineEndTime = newEnd;
    this.timelineDuration = newDuration;

    this.modifications[this.modifications.length - 1].current = {
      startTime: this.currentStartTime,
      endTime: this.currentEndTime,
      timelinePosition: newStart,
      duration: newDuration,
      timeScale
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
      this.currentStartTime = lastMod.before.startTime;
      this.currentEndTime = lastMod.before.endTime;
      this.timelineStartTime = lastMod.before.timelinePosition;
      this.timelineEndTime = lastMod.before.timelinePosition + 
        (lastMod.before.endTime - lastMod.before.startTime);
      this.timelineDuration = this.timelineEndTime - this.timelineStartTime;
    }
    this.state = CLIP_STATES.COMPLETED;
    return this;
  }

  getTimingInfo() {
    return {
      timelinePosition: this.timelineStartTime,
      currentIn: this.currentStartTime,
      currentOut: this.currentEndTime,
      originalIn: this.sourceStartTime,
      originalOut: this.sourceEndTime,
      duration: this.timelineDuration
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
    // Create a plain object version of the clip state
    const clipState = this.clips.get(clip.id) || new TimelineClipState(clip);
    this.clips.set(clip.id, clipState);
    return clipState;
  }

  startClipModification(clipId, modificationType) {
    const clipState = this.clips.get(clipId);
    if (clipState) {
      const updatedState = produce(clipState, draft => {
        draft.state = modificationType;
        draft.modifications.push({
          type: modificationType,
          timestamp: Date.now(),
          before: {
            startTime: draft.currentStartTime,
            endTime: draft.currentEndTime,
            timelinePosition: draft.timelineStartTime
          }
        });
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
        const delta = newPosition - draft.timelineStartTime;
        draft.timelineStartTime = newPosition;
        draft.timelineEndTime = newPosition + draft.timelineDuration;
        
        draft.modifications[draft.modifications.length - 1].current = {
          startTime: draft.currentStartTime,
          endTime: draft.currentEndTime,
          timelinePosition: newPosition,
          delta
        };
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
        const originalDuration = draft.sourceEndTime - draft.sourceStartTime;
        const newDuration = newEnd - newStart;
        const timeScale = originalDuration / newDuration;

        const sourceOffset = (newStart - draft.timelineStartTime) * timeScale;
        draft.currentStartTime = draft.sourceStartTime + sourceOffset;
        draft.currentEndTime = draft.currentStartTime + (newDuration * timeScale);
        
        draft.timelineStartTime = newStart;
        draft.timelineEndTime = newEnd;
        draft.timelineDuration = newDuration;

        draft.modifications[draft.modifications.length - 1].current = {
          startTime: draft.currentStartTime,
          endTime: draft.currentEndTime,
          timelinePosition: newStart,
          duration: newDuration,
          timeScale
        };
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
        const lastMod = draft.modifications[draft.modifications.length - 1];
        lastMod.completed = Date.now();
        draft.state = CLIP_STATES.COMPLETED;
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
        const lastMod = draft.modifications.pop();
        if (lastMod) {
          draft.currentStartTime = lastMod.before.startTime;
          draft.currentEndTime = lastMod.before.endTime;
          draft.timelineStartTime = lastMod.before.timelinePosition;
          draft.timelineEndTime = lastMod.before.timelinePosition + 
            (lastMod.before.endTime - lastMod.before.startTime);
          draft.timelineDuration = draft.timelineEndTime - draft.timelineStartTime;
        }
        draft.state = CLIP_STATES.COMPLETED;
      });
      this.clips.set(clipId, updatedState);
      return updatedState;
    }
    return null;
  }

  // Get all clips' current state
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