import React, { useRef, useState, useEffect } from 'react';
import '../styles/Viewer.css';

const Viewer = ({ title, selectedClip, onAddToTimeline }) => {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionWidth, setSelectionWidth] = useState(100);

  useEffect(() => {
    if (selectedClip && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(selectedClip.file);
      setSelectionStart(0);
      setSelectionWidth(100);
    }
  }, [selectedClip]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimelineClick = (e) => {
    if (timelineRef.current && videoRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedTime = (x / rect.width) * duration;
      videoRef.current.currentTime = clickedTime;
    }
  };

  const handleSelectionDrag = (e) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSelectionStart((x / rect.width) * 100);
    }
  };

  const handleSelectionResize = (e, isStart) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      if (isStart) {
        const newStart = (x / rect.width) * 100;
        setSelectionStart(newStart);
        setSelectionWidth(selectionWidth - (newStart - selectionStart));
      } else {
        setSelectionWidth((x / rect.width) * 100 - selectionStart);
      }
    }
  };

  const handleAddToTimeline = () => {
    if (onAddToTimeline) {
      onAddToTimeline({
        file: selectedClip.file,
        startTime: (selectionStart / 100) * duration,
        endTime: ((selectionStart + selectionWidth) / 100) * duration,
      });
    }
  };

  return (
    <div className="viewer">
      <h3>{title}</h3>
      {selectedClip && (
        <div className="viewer-content">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            controls
          />
          <div className="timeline" ref={timelineRef} onClick={handleTimelineClick}>
            <div className="timeline-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
            <div 
              className="selection" 
              style={{ left: `${selectionStart}%`, width: `${selectionWidth}%` }}
              onMouseDown={(e) => handleSelectionDrag(e)}
            >
              <div className="selection-handle start" onMouseDown={(e) => handleSelectionResize(e, true)}></div>
              <div className="selection-handle end" onMouseDown={(e) => handleSelectionResize(e, false)}></div>
              <button className="add-to-timeline" onClick={handleAddToTimeline}>+</button>
            </div>
          </div>
          <div className="time-display">
            {(currentTime / 60).toFixed(1)}m
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewer;