import React, { useRef, useState, useEffect } from 'react';
import '../styles/Viewer.css';
import '../styles/TimelineViewer.css';

const TimelineViewer = ({ selectedClip }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (selectedClip && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(selectedClip.file);
      videoRef.current.currentTime = selectedClip.startTime;
    }
  }, [selectedClip]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
      
      // Loop the video within the selected range
      if (selectedClip && videoRef.current.currentTime >= selectedClip.endTime) {
        videoRef.current.currentTime = selectedClip.startTime;
      }
    }
  };

  return (
    <div className="viewer timeline-viewer">
      <h3>Timeline Viewer</h3>
      {selectedClip && (
        <div className="viewer-content">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            controls
          />
          <div className="time-display">
            {(currentTime / 60).toFixed(1)}m
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineViewer;