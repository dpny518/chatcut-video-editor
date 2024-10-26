import { useState, useCallback, useRef } from 'react';

export const useTimelineManager = () => {
  const [timelines, setTimelines] = useState({});
  const [activeTimelineId, setActiveTimelineId] = useState(null);
  const relationshipGraph = useRef(new Map());
   /**
   * Checks if adding a reference would create a circular dependency
   */
   const wouldCreateCircularReference = useCallback((sourceId, targetId) => {
    const visited = new Set();
    
    const checkCircular = (current) => {
      if (current === sourceId) return true;
      if (visited.has(current)) return false;
      
      visited.add(current);
      const dependencies = relationshipGraph.current.get(current) || new Set();
      
      return Array.from(dependencies).some(dep => checkCircular(dep));
    };

    return checkCircular(targetId);
  }, []);

   /**
   * Updates the relationship graph when adding timeline references
   */
   const updateRelationshipGraph = useCallback((sourceId, targetId) => {
    if (!relationshipGraph.current.has(targetId)) {
      relationshipGraph.current.set(targetId, new Set());
    }
    relationshipGraph.current.get(targetId).add(sourceId);
  }, []);

  /**
   * Creates a new timeline
   */
  const createTimeline = useCallback((timelineInput) => {
    // Handle both string name and full timeline object
    const isStringInput = typeof timelineInput === 'string';
    const id = isStringInput ? `timeline-${Date.now()}` : timelineInput.id;
    
    // Create the new timeline object
    const newTimeline = isStringInput ? {
      id,
      name: timelineInput,
      clips: [],
      settings: {
        snapToGrid: true,
        autoScroll: true,
        showWaveforms: true,
        showTimecodes: true,
        zoomLevel: 1
      },
      metadata: {
        timeline: {
          start: 0,
          end: 300, // 5 minutes default
          duration: 300
        }
      },
      editorData: {
        actions: [],
        rows: [{ id: '0' }],
        duration: 300,
        startAt: 0,
        endAt: 300
      },
      references: []
    } : {
      ...timelineInput,
      id,
      clips: timelineInput.clips || [],
      settings: {
        ...timelineInput.settings,
        snapToGrid: true,
        autoScroll: true,
        showWaveforms: true,
        showTimecodes: true,
        zoomLevel: 1
      },
      metadata: {
        ...timelineInput.metadata,
        timeline: {
          start: 0,
          end: 300,
          duration: 300,
          ...timelineInput.metadata?.timeline
        }
      },
      editorData: {
        actions: [],
        rows: [{ id: '0' }],
        duration: 300,
        startAt: 0,
        endAt: 300,
        ...timelineInput.editorData
      },
      references: timelineInput.references || []
    };

    // Update timelines state
    setTimelines(prev => ({
      ...prev,
      [id]: newTimeline
    }));

    console.log('Creating timeline:', {
      id,
      timeline: newTimeline
    });

    // Set as active if it's the first timeline
    if (!activeTimelineId) {
      setActiveTimelineId(id);
    }

    return id;
  }, [activeTimelineId]);

  /**
   * Adds a clip to a timeline
   */
  const addClipToTimeline = useCallback(({
    sourceType,
    sourceId,
    clipData,
    targetTimelineId,
    position = 0,
    track = 0
  }) => {
    try {
      // Validate target timeline exists
      if (!timelines[targetTimelineId]) {
        throw new Error(`Target timeline ${targetTimelineId} not found`);
      }

      // If source is a timeline, validate reference
      if (sourceType === 'timeline') {
        if (!timelines[sourceId]) {
          throw new Error(`Source timeline ${sourceId} not found`);
        }
        
        if (wouldCreateCircularReference(sourceId, targetTimelineId)) {
          throw new Error('Operation would create circular reference');
        }
      }

      const clipDuration = clipData.duration || (clipData.endTime - clipData.startTime);
      
      // Create new clip with metadata
      const newClip = {
        id: `clip-${Date.now()}`,
        source: {
          type: sourceType,
          id: sourceId,
          startTime: clipData.startTime || 0,
          endTime: clipData.endTime || clipDuration,
          duration: clipDuration
        },
        metadata: {
          ...clipData.metadata,
          timeline: {
            start: position,
            end: position + clipDuration,
            duration: clipDuration
          },
          playback: {
            start: clipData.startTime || 0,
            end: clipData.endTime || clipDuration,
            duration: clipDuration
          }
        },
        name: clipData.name || `Clip ${Date.now()}`,
        hasBeenPositioned: true
      };

      // Update timeline with new clip
      setTimelines(prev => {
        const targetTimeline = prev[targetTimelineId];
        const updatedTimeline = {
          ...targetTimeline,
          clips: [...(targetTimeline.clips || []), newClip],
          references: sourceType === 'timeline' 
            ? [...(targetTimeline.references || []), { sourceId, clipId: newClip.id }]
            : targetTimeline.references
        };

        return {
          ...prev,
          [targetTimelineId]: updatedTimeline
        };
      });

      // Update relationship graph for timeline references
      if (sourceType === 'timeline') {
        updateRelationshipGraph(sourceId, targetTimelineId);
      }

      console.log('Added clip:', {
        clip: newClip,
        timeline: timelines[targetTimelineId]
      });

      return { success: true, clip: newClip };
    } catch (error) {
      console.error('Error adding clip:', error);
      return { success: false, error: error.message };
    }
  }, [timelines, wouldCreateCircularReference, updateRelationshipGraph]);

  /**
   * Moves a clip between timelines
   */
  const moveClipBetweenTimelines = useCallback(({
    clipId,
    sourceTimelineId,
    targetTimelineId,
    position,
    track
  }) => {
    // Validate timelines exist
    if (!timelines[sourceTimelineId] || !timelines[targetTimelineId]) {
      throw new Error('Invalid timeline IDs');
    }

    // Find clip in source timeline
    const sourceTimeline = timelines[sourceTimelineId];
    const clipIndex = sourceTimeline.clips.findIndex(c => c.id === clipId);
    
    if (clipIndex === -1) {
      throw new Error(`Clip ${clipId} not found in source timeline`);
    }

    const clip = sourceTimeline.clips[clipIndex];

    // Check for circular references if clip has timeline references
    if (clip.source.type === 'timeline' && 
        wouldCreateCircularReference(clip.source.id, targetTimelineId)) {
      throw new Error('Move would create circular reference');
    }

    // Remove from source timeline
    const newSourceClips = [...sourceTimeline.clips];
    newSourceClips.splice(clipIndex, 1);

    // Add to target timeline with new position
    const updatedClip = {
      ...clip,
      timeline: {
        ...clip.timeline,
        id: targetTimelineId,
        start: position,
        track
      }
    };

    // Update timelines
    setTimelines(prev => ({
      ...prev,
      [sourceTimelineId]: {
        ...prev[sourceTimelineId],
        clips: newSourceClips
      },
      [targetTimelineId]: {
        ...prev[targetTimelineId],
        clips: [...prev[targetTimelineId].clips, updatedClip]
      }
    }));

    // Update relationship graph if needed
    if (clip.source.type === 'timeline') {
      updateRelationshipGraph(clip.source.id, targetTimelineId);
    }

    return updatedClip;
  }, [timelines]);



 

  /**
   * Deletes a timeline and its references
   */
  const deleteTimeline = useCallback((timelineId) => {
    if (!timelines[timelineId]) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    // Check if any other timelines reference this one
    const hasReferences = Object.values(timelines).some(timeline => 
      timeline.clips.some(clip => 
        clip.source.type === 'timeline' && clip.source.id === timelineId
      )
    );

    if (hasReferences) {
      throw new Error('Cannot delete timeline that is referenced by other timelines');
    }

    // Remove from state
    setTimelines(prev => {
      const newTimelines = { ...prev };
      delete newTimelines[timelineId];
      return newTimelines;
    });

    // Update active timeline if needed
    if (activeTimelineId === timelineId) {
      const remainingIds = Object.keys(timelines);
      setActiveTimelineId(remainingIds.length > 0 ? remainingIds[0] : null);
    }

    // Clean up relationship graph
    relationshipGraph.current.delete(timelineId);
    for (const dependencies of relationshipGraph.current.values()) {
      dependencies.delete(timelineId);
    }
  }, [timelines, activeTimelineId]);

  return {
    timelines,
    activeTimelineId,
    setActiveTimelineId,
    createTimeline,
    deleteTimeline,
    addClipToTimeline,
    moveClipBetweenTimelines
  };
};