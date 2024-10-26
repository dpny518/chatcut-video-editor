import { useCallback, useMemo } from 'react';

/**
 * useTimelineValidation Hook
 * Comprehensive validation for timeline operations and references
 */
export const useTimelineValidation = (timelines, references) => {
  /**
   * Validates a clip addition operation
   */
  const validateClipAddition = useCallback(({
    sourceType,
    sourceId,
    targetTimelineId,
    clipData,
    position,
    track
  }) => {
    const errors = [];
    const warnings = [];

    // Timeline existence check
    if (!timelines[targetTimelineId]) {
      errors.push({
        code: 'INVALID_TIMELINE',
        message: `Target timeline ${targetTimelineId} does not exist`
      });
      return { valid: false, errors, warnings };
    }

    // Source validation
    if (sourceType === 'timeline') {
      if (!timelines[sourceId]) {
        errors.push({
          code: 'INVALID_SOURCE',
          message: `Source timeline ${sourceId} does not exist`
        });
      } else if (sourceId === targetTimelineId) {
        errors.push({
          code: 'SELF_REFERENCE',
          message: 'Cannot add clip from timeline to itself'
        });
      }
    } else if (sourceType === 'bin' && !clipData.file) {
      errors.push({
        code: 'MISSING_FILE',
        message: 'Bin clip must have associated file'
      });
    }

    // Time range validation
    if (clipData) {
      if (clipData.startTime >= clipData.endTime) {
        errors.push({
          code: 'INVALID_TIME_RANGE',
          message: 'Clip end time must be greater than start time'
        });
      }

      if (clipData.endTime - clipData.startTime < 0.1) {
        errors.push({
          code: 'CLIP_TOO_SHORT',
          message: 'Clip duration must be at least 0.1 seconds'
        });
      }
    }

    // Position validation
    const timeline = timelines[targetTimelineId];
    if (timeline) {
      // Check for overlapping clips on same track
      const hasOverlap = timeline.clips.some(existingClip => {
        if (existingClip.timeline.track !== track) return false;
        
        const clipStart = position;
        const clipEnd = position + (clipData.endTime - clipData.startTime);
        const existingStart = existingClip.timeline.start;
        const existingEnd = existingClip.timeline.end;

        return (clipStart < existingEnd && clipEnd > existingStart);
      });

      if (hasOverlap) {
        warnings.push({
          code: 'CLIP_OVERLAP',
          message: 'Clip overlaps with existing clip on track'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [timelines]);

  /**
   * Validates clip movement operation
   */
  const validateClipMove = useCallback(({
    clipId,
    sourceTimelineId,
    targetTimelineId,
    newPosition,
    newTrack
  }) => {
    const errors = [];
    const warnings = [];

    // Timeline existence
    if (!timelines[sourceTimelineId]) {
      errors.push({
        code: 'INVALID_SOURCE_TIMELINE',
        message: `Source timeline ${sourceTimelineId} does not exist`
      });
    }

    if (!timelines[targetTimelineId]) {
      errors.push({
        code: 'INVALID_TARGET_TIMELINE',
        message: `Target timeline ${targetTimelineId} does not exist`
      });
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Find clip
    const sourceTimeline = timelines[sourceTimelineId];
    const clip = sourceTimeline.clips.find(c => c.id === clipId);

    if (!clip) {
      errors.push({
        code: 'CLIP_NOT_FOUND',
        message: `Clip ${clipId} not found in source timeline`
      });
      return { valid: false, errors, warnings };
    }

    // Check for reference cycles if moving between timelines
    if (sourceTimelineId !== targetTimelineId && clip.source.type === 'timeline') {
      const wouldCreateCycle = checkForReferenceCycle(
        clip.source.id,
        targetTimelineId,
        new Set()
      );

      if (wouldCreateCycle) {
        errors.push({
          code: 'CIRCULAR_REFERENCE',
          message: 'Move would create circular reference'
        });
      }
    }

    // Validate new position
    if (newPosition < 0) {
      errors.push({
        code: 'INVALID_POSITION',
        message: 'New position cannot be negative'
      });
    }

    // Track bounds
    if (newTrack < 0) {
      errors.push({
        code: 'INVALID_TRACK',
        message: 'Track number cannot be negative'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [timelines]);

  /**
   * Validates timeline deletion
   */
  const validateTimelineDeletion = useCallback((timelineId) => {
    const errors = [];
    const warnings = [];

    // Check timeline exists
    if (!timelines[timelineId]) {
      errors.push({
        code: 'INVALID_TIMELINE',
        message: `Timeline ${timelineId} does not exist`
      });
      return { valid: false, errors, warnings };
    }

    // Check for references to this timeline
    const hasReferences = Object.values(timelines).some(timeline =>
      timeline.clips.some(clip =>
        clip.source.type === 'timeline' && clip.source.id === timelineId
      )
    );

    if (hasReferences) {
      errors.push({
        code: 'TIMELINE_REFERENCED',
        message: 'Cannot delete timeline that is referenced by other timelines'
      });
    }

    // Warn about clip count
    const clipCount = timelines[timelineId].clips.length;
    if (clipCount > 0) {
      warnings.push({
        code: 'HAS_CLIPS',
        message: `Timeline contains ${clipCount} clips that will be deleted`
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [timelines]);

  /**
   * Validates clip trimming operation
   */
  const validateClipTrim = useCallback(({
    timelineId,
    clipId,
    newStart,
    newEnd
  }) => {
    const errors = [];
    const warnings = [];

    // Find clip
    const timeline = timelines[timelineId];
    if (!timeline) {
      errors.push({
        code: 'INVALID_TIMELINE',
        message: `Timeline ${timelineId} does not exist`
      });
      return { valid: false, errors, warnings };
    }

    const clip = timeline.clips.find(c => c.id === clipId);
    if (!clip) {
      errors.push({
        code: 'INVALID_CLIP',
        message: `Clip ${clipId} does not exist`
      });
      return { valid: false, errors, warnings };
    }

    // Validate time range
    if (newStart >= newEnd) {
      errors.push({
        code: 'INVALID_RANGE',
        message: 'Start time must be less than end time'
      });
    }

    if (newEnd - newStart < 0.1) {
      errors.push({
        code: 'CLIP_TOO_SHORT',
        message: 'Clip duration must be at least 0.1 seconds'
      });
    }

    // Source bounds check
    if (clip.source.type === 'timeline') {
      const sourceClip = timelines[clip.source.id]?.clips
        .find(c => c.id === clip.source.clipId);

      if (sourceClip) {
        if (newStart < sourceClip.timeline.start || newEnd > sourceClip.timeline.end) {
          errors.push({
            code: 'OUT_OF_BOUNDS',
            message: 'Trim operation exceeds source clip bounds'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [timelines]);

  /**
   * Validates entire timeline structure
   */
  const validateTimelineStructure = useCallback(() => {
    const errors = [];
    const warnings = [];

    // Check for circular references
    const visited = new Set();
    const checkCircular = (timelineId, path = []) => {
      if (path.includes(timelineId)) {
        errors.push({
          code: 'CIRCULAR_REFERENCE',
          message: `Circular reference detected: ${[...path, timelineId].join(' -> ')}`
        });
        return;
      }

      if (visited.has(timelineId)) return;
      visited.add(timelineId);

      const timeline = timelines[timelineId];
      if (!timeline) return;

      for (const clip of timeline.clips) {
        if (clip.source.type === 'timeline') {
          checkCircular(clip.source.id, [...path, timelineId]);
        }
      }
    };

    // Check all timelines
    Object.keys(timelines).forEach(timelineId => {
      checkCircular(timelineId);
    });

    // Check for broken references
    Object.values(timelines).forEach(timeline => {
      timeline.clips.forEach(clip => {
        if (clip.source.type === 'timeline') {
          if (!timelines[clip.source.id]) {
            errors.push({
              code: 'BROKEN_REFERENCE',
              message: `Clip ${clip.id} references non-existent timeline ${clip.source.id}`
            });
          }
        }
      });
    });

    // Check for overlapping clips
    Object.values(timelines).forEach(timeline => {
      const trackClips = new Map();
      
      timeline.clips.forEach(clip => {
        if (!trackClips.has(clip.timeline.track)) {
          trackClips.set(clip.timeline.track, []);
        }
        trackClips.get(clip.timeline.track).push(clip);
      });

      trackClips.forEach(clips => {
        clips.sort((a, b) => a.timeline.start - b.timeline.start);
        
        for (let i = 0; i < clips.length - 1; i++) {
          if (clips[i].timeline.end > clips[i + 1].timeline.start) {
            warnings.push({
              code: 'CLIP_OVERLAP',
              message: `Overlapping clips detected on timeline ${timeline.id}, track ${clips[i].timeline.track}`
            });
          }
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [timelines]);

  /**
   * Checks for reference cycles
   */
  const checkForReferenceCycle = useCallback((sourceId, targetId, visited) => {
    if (sourceId === targetId) return true;
    if (visited.has(targetId)) return false;
    
    visited.add(targetId);
    const timeline = timelines[targetId];
    
    if (!timeline) return false;

    return timeline.clips.some(clip =>
      clip.source.type === 'timeline' &&
      checkForReferenceCycle(sourceId, clip.source.id, new Set(visited))
    );
  }, [timelines]);

  // Create validation memo for performance
  const validateState = useMemo(() => {
    const state = validateTimelineStructure();
    return {
      isValid: state.valid,
      hasWarnings: state.warnings.length > 0,
      errorCount: state.errors.length,
      warningCount: state.warnings.length
    };
  }, [validateTimelineStructure]);

  return {
    // Operation validators
    validateClipAddition,
    validateClipMove,
    validateClipTrim,
    validateTimelineDeletion,
    validateTimelineStructure,
    
    // State
    validateState,
    
    // Helpers
    checkForReferenceCycle
  };
};