import { useCallback, useRef, useState } from 'react';

/**
 * useTimelineReferences Hook
 * Manages clip references between timelines, tracks dependencies,
 * and prevents circular references
 */
export const useTimelineReferences = () => {
  // Track all references between timelines
  const [references, setReferences] = useState(new Map());
  
  // Cache for dependency calculations
  const dependencyCache = useRef(new Map());
  
  /**
   * Creates a new reference between clips/timelines
   */
  const createReference = useCallback(({
    sourceType,      // 'bin' or 'timeline'
    sourceId,        // ID of source timeline or bin item
    sourceClipId,    // ID of source clip
    targetTimelineId,// Timeline where reference will be created
    targetClipId,    // New clip ID in target timeline
    timeRange,       // { start, end } in source clip's time
    metadata = {}    // Additional reference data
  }) => {
    const referenceId = `ref-${Date.now()}`;
    
    const reference = {
      id: referenceId,
      sourceType,
      sourceId,
      sourceClipId,
      targetTimelineId,
      targetClipId,
      timeRange,
      metadata,
      created: Date.now()
    };

    setReferences(prev => {
      const updated = new Map(prev);
      if (!updated.has(targetTimelineId)) {
        updated.set(targetTimelineId, new Map());
      }
      updated.get(targetTimelineId).set(targetClipId, reference);
      return updated;
    });

    // Clear dependency cache as relationships changed
    dependencyCache.current.clear();
    
    return reference;
  }, []);

  /**
   * Validates if creating a reference would cause circular dependencies
   */
  const validateReference = useCallback(({
    sourceTimelineId,
    targetTimelineId
  }) => {
    if (sourceTimelineId === targetTimelineId) {
      return {
        valid: false,
        error: 'Cannot reference clips from the same timeline'
      };
    }

    const findDependencies = (timelineId, visited = new Set()) => {
      if (visited.has(timelineId)) {
        return visited;
      }

      visited.add(timelineId);
      const timelineRefs = references.get(timelineId) || new Map();
      
      for (const [, ref] of timelineRefs) {
        if (ref.sourceType === 'timeline') {
          findDependencies(ref.sourceId, visited);
        }
      }

      return visited;
    };

    // Check if this would create a circular reference
    const dependencies = findDependencies(targetTimelineId);
    if (dependencies.has(sourceTimelineId)) {
      return {
        valid: false,
        error: 'Operation would create circular reference'
      };
    }

    return { valid: true };
  }, [references]);

  /**
   * Gets all references for a timeline
   */
  const getTimelineReferences = useCallback((timelineId) => {
    return Array.from(references.get(timelineId)?.values() || []);
  }, [references]);

  /**
   * Gets all timelines that reference a specific timeline
   */
  const getDependentTimelines = useCallback((timelineId) => {
    const dependents = new Set();
    
    for (const [targetId, refs] of references) {
      for (const [, ref] of refs) {
        if (ref.sourceType === 'timeline' && ref.sourceId === timelineId) {
          dependents.add(targetId);
        }
      }
    }

    return Array.from(dependents);
  }, [references]);

  /**
   * Updates an existing reference
   */
  const updateReference = useCallback(({
    targetTimelineId,
    targetClipId,
    updates
  }) => {
    setReferences(prev => {
      const updated = new Map(prev);
      const timelineRefs = updated.get(targetTimelineId);
      
      if (!timelineRefs?.has(targetClipId)) {
        throw new Error('Reference not found');
      }

      const reference = timelineRefs.get(targetClipId);
      timelineRefs.set(targetClipId, {
        ...reference,
        ...updates,
        updated: Date.now()
      });

      return updated;
    });
  }, []);

  /**
   * Deletes a reference
   */
  const deleteReference = useCallback(({
    targetTimelineId,
    targetClipId
  }) => {
    setReferences(prev => {
      const updated = new Map(prev);
      const timelineRefs = updated.get(targetTimelineId);
      
      if (timelineRefs) {
        timelineRefs.delete(targetClipId);
        if (timelineRefs.size === 0) {
          updated.delete(targetTimelineId);
        }
      }

      return updated;
    });

    // Clear dependency cache
    dependencyCache.current.clear();
  }, []);

  /**
   * Checks if a clip is referenced by other timelines
   */
  const isClipReferenced = useCallback(({
    timelineId,
    clipId
  }) => {
    for (const [, refs] of references) {
      for (const [, ref] of refs) {
        if (ref.sourceType === 'timeline' && 
            ref.sourceId === timelineId && 
            ref.sourceClipId === clipId) {
          return true;
        }
      }
    }
    return false;
  }, [references]);

  /**
   * Gets the reference chain for a clip
   */
  const getReferenceChain = useCallback(({
    timelineId,
    clipId
  }) => {
    const chain = [];
    let current = references.get(timelineId)?.get(clipId);
    
    while (current && current.sourceType === 'timeline') {
      chain.push(current);
      current = references.get(current.sourceId)?.get(current.sourceClipId);
    }

    return chain;
  }, [references]);

  /**
   * Validates entire reference structure
   */
  const validateReferenceStructure = useCallback(() => {
    const issues = [];
    const visited = new Set();

    const checkTimeline = (timelineId) => {
      if (visited.has(timelineId)) {
        issues.push({
          type: 'circular',
          message: `Circular reference detected involving timeline ${timelineId}`
        });
        return;
      }

      visited.add(timelineId);
      const timelineRefs = references.get(timelineId);
      
      if (timelineRefs) {
        for (const [clipId, ref] of timelineRefs) {
          if (ref.sourceType === 'timeline') {
            checkTimeline(ref.sourceId);
          }
        }
      }

      visited.delete(timelineId);
    };

    // Check all timelines
    for (const [timelineId] of references) {
      checkTimeline(timelineId);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }, [references]);

  return {
    // Core operations
    createReference,
    updateReference,
    deleteReference,
    
    // Queries
    getTimelineReferences,
    getDependentTimelines,
    isClipReferenced,
    getReferenceChain,
    
    // Validation
    validateReference,
    validateReferenceStructure
  };
};