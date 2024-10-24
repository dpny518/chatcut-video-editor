import { useState, useCallback } from 'react';
import { produce, enableMapSet } from 'immer';
import debug from 'debug';

// Create debuggers
const logTrim = debug('timeline:trim');
const logState = debug('timeline:state');
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
    this.timelineEnd = clip.metadata.timeline.end;
    this.timelineDuration = this.timelineEnd - this.timelineStart;

    // Current in/out points (changes with trims)
    this.currentIn = clip.metadata?.current?.in ?? this.sourceStart;
    this.currentOut = clip.metadata?.current?.out ?? this.sourceEnd;
    
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
        currentIn: this.currentIn,
        currentOut: this.currentOut
      }
    });
    return this;
  }

  moveClip(newPosition) {
    const moveDelta = newPosition - this.timelineStart;
    console.log('=== moving clip in Trim Clip State===');
    this.timelineStart = newPosition;
    this.timelineEnd = newPosition + this.timelineDuration;
    
    this.modifications[this.modifications.length - 1].current = {
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      currentIn: this.currentIn,
      currentOut: this.currentOut,
      moveDelta
    };
    
    return this;
  }

  trimClip(newStart, newEnd) {
    console.log('=== Called TRIM Function in Trim Clip State ===');
    // Store original values
    const originalState = {
      timeline: {
        start: this.timelineStart,
        end: this.timelineEnd,
      },
      current: {
        in: this.currentIn,
        out: this.currentOut,
      }
    };

    // Calculate deltas
    const startDelta = newStart - originalState.timeline.start;
    const endDelta = newEnd - originalState.timeline.end;

    // Detect which end is being trimmed
    const startChanged = Math.abs(startDelta) > 0.001;
    const endChanged = Math.abs(endDelta) > 0.001;

    console.log('=== TRIM START ===');
    console.log('Original Values:', originalState);
    console.log('Deltas:', { startDelta, endDelta });

    if (!startChanged && endChanged) {
      // RIGHT TRIM
      console.log('RIGHT TRIM DETECTED');
      
      // Keep start fixed
      this.timelineStart = originalState.timeline.start;
      this.currentIn = originalState.current.in;
      
      // Update end points with same delta
      this.timelineEnd = newEnd;
      this.currentOut = Math.min(
        this.sourceEnd,
        originalState.current.out + endDelta  // Direct delta application
      );

      console.log('Right Trim Results:', {
        delta: endDelta,
        originalOut: originalState.current.out,
        newCurrentOut: this.currentOut,
        direction: endDelta > 0 ? 'LENGTHENING' : 'SHORTENING'
      });
      
    } else if (startChanged && !endChanged) {
      // LEFT TRIM
      console.log('LEFT TRIM DETECTED');
      
      // Keep end fixed
      this.timelineEnd = originalState.timeline.end;
      this.currentOut = originalState.current.out;
      
      // Update start points with same delta
      this.timelineStart = newStart;
      this.currentIn = Math.max(
        this.sourceStart,
        originalState.current.in + startDelta  // Direct delta application
      );

      console.log('Left Trim Results:', {
        delta: startDelta,
        originalIn: originalState.current.in,
        newCurrentIn: this.currentIn,
        direction: startDelta > 0 ? 'SHORTENING' : 'LENGTHENING'
      });
    }

    // Update duration
    this.timelineDuration = this.timelineEnd - this.timelineStart;

    // Record the modification
    this.modifications[this.modifications.length - 1].current = {
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      currentIn: this.currentIn,
      currentOut: this.currentOut,
      isLeftTrim: startChanged,
      delta: startChanged ? startDelta : endDelta,
      direction: startChanged ? 
        (startDelta > 0 ? 'SHORTENING' : 'LENGTHENING') :
        (endDelta > 0 ? 'LENGTHENING' : 'SHORTENING')
    };

    console.log('=== FINAL STATE ===');
    console.log('Final Values:', {
      timeline: {
        start: this.timelineStart.toFixed(2),
        end: this.timelineEnd.toFixed(2),
        duration: this.timelineDuration.toFixed(2)
      },
      current: {
        in: this.currentIn.toFixed(2),
        out: this.currentOut.toFixed(2),
        duration: (this.currentOut - this.currentIn).toFixed(2)
      }
    });

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
      this.currentIn = lastMod.before.currentIn;
      this.currentOut = lastMod.before.currentOut;
      this.timelineDuration = this.timelineEnd - this.timelineStart;
    }
    this.state = CLIP_STATES.COMPLETED;
    return this;
  }

  getTimingInfo() {console.log('=== Getting Timeline info')
    return {
      // Timeline timing
      
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      timelineDuration: this.timelineEnd - this.timelineStart,
      
      // Current timing (changes with trims)
      currentIn: this.currentIn,
      currentOut: this.currentOut,
      currentDuration: this.currentOut - this.currentIn,
      
      // Original source timing
      originalIn: this.sourceStart,
      originalOut: this.sourceEnd,
      originalDuration: this.sourceDuration,
      
      // Relative timing
      relativeStart: this.currentIn - this.sourceStart,
      relativeDuration: this.currentOut - this.currentIn
    };
  }

  mapTimelineToSource(timelinePosition) {
    const timelineProgress = (timelinePosition - this.timelineStart) / this.timelineDuration;
    const currentDuration = this.currentOut - this.currentIn;
    return this.currentIn + (timelineProgress * currentDuration);
  }

  mapSourceToTimeline(sourcePosition) {
    const currentProgress = (sourcePosition - this.currentIn) / (this.currentOut - this.currentIn);
    return this.timelineStart + (currentProgress * this.timelineDuration);
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
    console.log('TimelineStateManager.trimClip called:', {
        clipId,
        newStart,
        newEnd
    });

    const clipState = this.clips.get(clipId);
    if (clipState && this.currentOperation?.clipId === clipId) {
        console.log('Found clipState:', {
            timelineStart: clipState.timelineStart,
            timelineEnd: clipState.timelineEnd,
            currentIn: clipState.currentIn,
            currentOut: clipState.currentOut
        });

        const updatedState = produce(clipState, draft => {
            console.log('Calling draft.trimClip with:', { newStart, newEnd });
            draft.trimClip(newStart, newEnd);
        });

        console.log('After trimClip:', {
            timelineStart: updatedState.timelineStart,
            timelineEnd: updatedState.timelineEnd,
            currentIn: updatedState.currentIn,
            currentOut: updatedState.currentOut
        });

        this.clips.set(clipId, updatedState);
        return updatedState;
    } else {
        console.log('Clip state or operation not found:', {
            hasClipState: Boolean(clipState),
            currentOperation: this.currentOperation
        });
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