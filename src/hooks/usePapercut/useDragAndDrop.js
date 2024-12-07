// useDragAndDrop.js
import { useState, useRef, useCallback } from 'react';
import { useSprings } from '@react-spring/web';

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

  const handleDragStart = (e, segmentId) => {
    if (!selectedSegments.has(segmentId)) {
      setDraggedSegment([segmentId]);
      e.dataTransfer.setData('text/plain', JSON.stringify([segmentId]));
    } else {
      setDraggedSegment([...selectedSegments]);
      e.dataTransfer.setData('text/plain', JSON.stringify([...selectedSegments]));
    }
  };

  const handleDragEnd = () => {
    setDraggedSegment(null);
    setDropIndicator(null);
    api.start(i => ({ y: 0, scale: 1, zIndex: 0, immediate: false }));
  };

  const handleDragOver = (e, segment) => {
    e.preventDefault();
    if (!draggedSegment || draggedSegment.includes(segment.id)) {
      setDropIndicator(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'top' : 'bottom';

    setDropIndicator({ targetId: segment.id, position });
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSegment) => {
    e.preventDefault();
    if (!dropIndicator) return;

    const draggedIds = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (draggedIds.includes(targetSegment.id)) return;

    const targetIdx = content.findIndex(s => s.id === targetSegment.id);
    const selectedItems = content.filter(s => draggedIds.includes(s.id));
    const remainingItems = content.filter(s => !draggedIds.includes(s.id));

    const insertIdx = dropIndicator.position === 'bottom' ? targetIdx + 1 : targetIdx;
    remainingItems.splice(insertIdx, 0, ...selectedItems);

    handleContentUpdate(remainingItems, 'move');
    setDropIndicator(null);
    setDraggedSegment(null);
  };

  return {
    draggedSegment,
    dropIndicator,
    isValidDrop,
    segmentRefs,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    springs
  };
};