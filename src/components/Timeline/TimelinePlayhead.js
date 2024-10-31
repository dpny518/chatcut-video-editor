import React, { useEffect, useRef } from 'react';

const TimelinePlayhead = ({ currentTime, duration, scale = 1 }) => {
  const playheadRef = useRef(null);
  
  useEffect(() => {
    if (playheadRef.current) {
      const position = (currentTime / duration) * 100;
      playheadRef.current.style.left = `${position}%`;
    }
  }, [currentTime, duration]);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
      style={{
        transition: 'left 0.1s linear',
        boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
      }}
    >
      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -bottom-1 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
    </div>
  );
};

export default TimelinePlayhead;