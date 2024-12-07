// hooks/useDragAndDrop.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSprings, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

const DRAG_THRESHOLD = 5;

export const useDragAndDrop = (content, handleContentUpdate, selectedSegments) => {
  const [draggedSegment, setDraggedSegment] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [isValidDrop, setIsValidDrop] = useState(false);
  
  const segmentRefs = useRef({});

  const [springs, api] = useSprings(content.length, i => ({
    y: 0,
    scale: 1,
    zIndex: 0,
    immediate: true,
  }));

  const resetSprings = useCallback(() => {
    api.start(i => ({
      y: 0,
      scale: 1,
      zIndex: 0,
      immediate: true,
    }));
  }, [api]);

  useEffect(() => {
    resetSprings();
  }, [content, resetSprings]);

  const updateSprings = useCallback((draggedIds, dropIndex) => {
    const draggedSet = new Set(draggedIds);
    const itemHeight = 60; // Approximate height of a segment, adjust as needed

    api.start(i => {
      if (draggedSet.has(content[i].id)) {
        return { y: 0, scale: 1.05, zIndex: 1, immediate: false };
      }
      if (i < dropIndex && !draggedSet.has(content[i].id)) {
        return { y: draggedSet.size * itemHeight, scale: 1, zIndex: 0, immediate: false };
      }
      if (i >= dropIndex && !draggedSet.has(content[i].id)) {
        return { y: -draggedSet.size * itemHeight, scale: 1, zIndex: 0, immediate: false };
      }
      return { y: 0, scale: 1, zIndex: 0, immediate: false };
    });
  }, [content, api]);

  const bindDrag = useDrag(({ args: [segmentId], active, movement: [, y], xy: [, cy], last, first }) => {
    if (first) {
      resetSprings();
    }

    if (active) {
      const draggedIds = selectedSegments?.has(segmentId) ? Array.from(selectedSegments) : [segmentId];
      setDraggedSegment(draggedIds);

      const segmentRectsList = Object.values(segmentRefs.current).map(el => el.getBoundingClientRect());
      const dropIndex = segmentRectsList.findIndex(rect => cy < rect.bottom);

      updateSprings(draggedIds, dropIndex);

      // Determine the most appropriate drop indicator
      let targetSegment, position;
      if (dropIndex === 0) {
        // Dropping at the very top
        targetSegment = content[0];
        position = 'top';
      } else if (dropIndex === -1) {
        // Dropping at the very bottom
        targetSegment = content[content.length - 1];
        position = 'bottom';
      } else {
        const currentRect = segmentRectsList[dropIndex];
        const prevRect = segmentRectsList[dropIndex - 1];
        
        if (prevRect && cy - prevRect.bottom < currentRect.top - cy) {
          // Closer to the previous segment
          targetSegment = content[dropIndex - 1];
          position = 'bottom';
        } else {
          // Closer to the current segment
          targetSegment = content[dropIndex];
          position = 'top';
        }
      }

      // Don't show drop indicator if trying to drop item onto itself
      if (!draggedIds.includes(targetSegment.id)) {
        setDropIndicator({ targetId: targetSegment.id, position });
        setIsValidDrop(true);
      } else {
        setDropIndicator(null);
        setIsValidDrop(false);
      }
    } else if (last) {
      handleDrop();
      resetSprings();
    }
  }, {
    threshold: DRAG_THRESHOLD,
    filterTaps: true,
    rubberband: true
  });

  const handleDrop = useCallback(() => {
    if (!isValidDrop || !draggedSegment || !dropIndicator) {
      setDraggedSegment(null);
      setDropIndicator(null);
      setIsValidDrop(false);
      return;
    }
  
    const { targetId, position } = dropIndicator;
  
    let targetIndex = content.findIndex(segment => segment.id === targetId);
    if (position === 'bottom') {
      targetIndex += 1;
    }
  
    const draggedSegmentIds = new Set(draggedSegment);
    const filteredContent = content.filter(segment => !draggedSegmentIds.has(segment.id));
  
    const adjustedTargetIndex = targetIndex - filteredContent
      .slice(0, targetIndex)
      .filter(segment => draggedSegmentIds.has(segment.id)).length;
  
    const draggedSegments = content.filter(segment => draggedSegmentIds.has(segment.id));
  
    const newContent = [...filteredContent];
    newContent.splice(adjustedTargetIndex, 0, ...draggedSegments);
  
    handleContentUpdate(newContent, 'move');
  
    setDraggedSegment(null);
    setDropIndicator(null);
    setIsValidDrop(false);
  }, [content, draggedSegment, dropIndicator, isValidDrop, handleContentUpdate]);

  return {
    draggedSegment,
    dropIndicator,
    isValidDrop,
    segmentRefs,
    bindDrag,
    springs
  };
};