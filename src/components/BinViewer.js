import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';

const BinViewer = ({ selectedClip, onAddToTimeline }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const videoRef = useRef(null);

  const handleAddToTimeline = () => {
    onAddToTimeline({
      ...selectedClip,
      startTime,
      endTime
    });
  };

  // Implement drag handlers for selection
  const handleDragStart = (e) => {
    // Set start time based on drag position
  };

  const handleDragEnd = (e) => {
    // Set end time based on drag position
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
      <Box sx={{ flexGrow: 1, mb: 2, position: 'relative' }}>
        <video
          ref={videoRef}
          src={URL.createObjectURL(selectedClip.file)}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {/* Add draggable selection overlay here */}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography>
          Selection: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s
        </Typography>
        <IconButton onClick={handleAddToTimeline} color="primary">
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default BinViewer;