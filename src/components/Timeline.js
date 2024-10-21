import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import WaveSurfer from 'wavesurfer.js';

const Timeline = ({ clips, onClipsChange }) => {
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timelineRef = useRef(null);
  const waveformRefs = useRef({});

  useEffect(() => {
    if (timelineRef.current) {
      setTimelineWidth(timelineRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    clips.forEach((clip) => {
      if (!waveformRefs.current[clip.id]) {
        const wavesurfer = WaveSurfer.create({
          container: `#waveform-${clip.id}`,
          waveColor: 'violet',
          progressColor: 'purple',
          responsive: true,
          height: 30,
          barWidth: 2,
          barGap: 1,
        });
        wavesurfer.load(URL.createObjectURL(clip.file));
        waveformRefs.current[clip.id] = wavesurfer;
      }
    });

    return () => {
      Object.values(waveformRefs.current).forEach((wavesurfer) => wavesurfer.destroy());
    };
  }, [clips]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newClips = Array.from(clips);
    const [reorderedClip] = newClips.splice(result.source.index, 1);
    newClips.splice(result.destination.index, 0, reorderedClip);

    onClipsChange(newClips);
  };

  const handleResizeClip = (clipId, newDuration) => {
    const updatedClips = clips.map((clip) =>
      clip.id === clipId ? { ...clip, duration: newDuration } : clip
    );
    onClipsChange(updatedClips);
  };

  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
  const pixelsPerSecond = timelineWidth / totalDuration;

  return (
    <Box ref={timelineRef} sx={{ width: '100%', overflowX: 'auto', bgcolor: '#2c2c2c', p: 2 }}>
      <TimeScale totalDuration={totalDuration} pixelsPerSecond={pixelsPerSecond} />
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline" direction="horizontal">
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ display: 'flex', minHeight: 100, mt: 1 }}
            >
              {clips.map((clip, index) => (
                <Draggable key={clip.id} draggableId={clip.id} index={index}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        width: `${clip.duration * pixelsPerSecond}px`,
                        minWidth: 100,
                        mr: 1,
                        bgcolor: '#3c3c3c',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Typography variant="caption" sx={{ p: 0.5, color: 'white' }}>
                        {clip.name}
                      </Typography>
                      <Box id={`waveform-${clip.id}`} />
                      <ResizeHandle
                        clipId={clip.id}
                        onResize={(newWidth) =>
                          handleResizeClip(clip.id, newWidth / pixelsPerSecond)
                        }
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
};

const TimeScale = ({ totalDuration, pixelsPerSecond }) => {
  const scaleMarkers = [];
  const markerInterval = 5; // Seconds between each marker

  for (let i = 0; i <= totalDuration; i += markerInterval) {
    scaleMarkers.push(
      <Box
        key={i}
        sx={{
          position: 'absolute',
          left: `${i * pixelsPerSecond}px`,
          height: 10,
          borderLeft: '1px solid white',
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
          {formatTime(i)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: 20, mb: 1 }}>
      {scaleMarkers}
    </Box>
  );
};

const ResizeHandle = ({ clipId, onResize }) => {
  const handleRef = useRef(null);

  useEffect(() => {
    const handle = handleRef.current;
    let isDragging = false;
    let startX, startWidth;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startWidth = handle.parentElement.offsetWidth;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + delta);
      onResize(newWidth);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [onResize]);

  return (
    <Box
      ref={handleRef}
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 10,
        bgcolor: 'rgba(255, 255, 255, 0.3)',
        cursor: 'ew-resize',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.5)',
        },
      }}
    />
  );
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default Timeline;