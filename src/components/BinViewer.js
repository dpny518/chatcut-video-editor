import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const BinViewer = ({ selectedClip }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const videoRef = useRef(null);

  // Handle Mouse Down Events
  const handleMouseDownStart = (e) => {
    e.preventDefault();
    console.log('Start handle clicked');
    setIsDraggingStart(true);
  };

  const handleMouseDownEnd = (e) => {
    e.preventDefault();
    console.log('End handle clicked');
    setIsDraggingEnd(true);
  };

  // Handle Mouse Move Events
  const handleMouseMove = (e) => {
    if (isDraggingStart) {
      console.log('Dragging Start');
      const newTime = calculateTimeFromMousePosition(e);
      if (newTime < endTime) {
        console.log('New Start Time:', newTime);
        setStartTime(newTime);
      }
    } else if (isDraggingEnd) {
      console.log('Dragging End');
      const newTime = calculateTimeFromMousePosition(e);
      if (newTime > startTime) {
        console.log('New End Time:', newTime);
        setEndTime(newTime);
      }
    }
  };

  // Handle Mouse Up Events
  // eslint-disable-next-line
  const handleMouseUp = () => {
    console.log('Mouse Up');
    if (isDraggingStart) {
      setIsDraggingStart(false);
      console.log('Stopped dragging start');
    }
    if (isDraggingEnd) {
      setIsDraggingEnd(false);
      console.log('Stopped dragging end');
    }
  };

  // Calculate time from mouse position
  const calculateTimeFromMousePosition = (e) => {
    const rect = videoRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(clickX / rect.width, 1)); // Keep percent between 0 and 1
    const newTime = percent * videoRef.current.duration;
  
    console.log('Mouse Position:', e.clientX, 'Percent:', percent, 'New Time:', newTime);
  
    return newTime;
  };

  // Ensure mouse move and up are handled at document level
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
    // eslint-disable-next-line
  }, [isDraggingStart, isDraggingEnd]);

  // Ensure video metadata is loaded before setting endTime
  const handleLoadedMetadata = () => {
    console.log('Video Duration:', videoRef.current.duration);
    setEndTime(videoRef.current.duration); // Set end time when metadata loads
  };

  if (!selectedClip) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No video selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {selectedClip.file.name}
      </Typography>
      <Box sx={{ position: 'relative', flexGrow: 1, mb: 2 }}>
        <video
          ref={videoRef}
          src={URL.createObjectURL(selectedClip.file)}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        
        {/* Start Handle */}
        <div
          style={{
            position: 'absolute',
            left: `${(startTime / videoRef.current?.duration) * 100}%`,
            top: '0',
            width: '10px',
            height: '100%',
            background: 'yellow',
            cursor: 'ew-resize',
            zIndex: 10,
            border: '2px solid red',  // Add this for visual debugging
          }}
          onMouseDown={handleMouseDownStart}
        />
        
        {/* End Handle */}
        <div
          style={{
            position: 'absolute',
            left: `${(endTime / videoRef.current?.duration) * 100}%`,
            top: '0',
            width: '10px',
            height: '100%',
            background: 'yellow',
            cursor: 'ew-resize',
            zIndex: 10,
            border: '2px solid blue',  // Add this for visual debugging
          }}
          onMouseDown={handleMouseDownEnd}
        />
      </Box>
      <Typography>
        Selected Range: {JSON.stringify({ start: startTime.toFixed(2), end: endTime.toFixed(2) })}
      </Typography>
    </Box>
  );
};

export default BinViewer;