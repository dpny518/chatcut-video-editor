// src/components/Timeline/index.js
import React from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography } from '@mui/material';
import TimelineControls from './TimelineControls'; // Change this line
import TimelineClip from './TimelineClip'; // Also change this if needed
import { useTimelineZoom } from '../../hooks/useTimeline/useTimelineZoom';
import { useTimelineData } from '../../hooks/useTimeline/useTimelineData';
import { formatTime } from '../../utils/formatters';
import { DEFAULT_ROW_HEIGHT } from '../../utils/constants';

const Timeline = ({ 
  clips = [], 
  onClipsChange,
  selectedClipId,
  onClipSelect,
}) => {
  const { scale, handleZoomIn, handleZoomOut } = useTimelineZoom();
  const { editorData, effects, error, handleChange } = useTimelineData(clips, onClipsChange);

  // Render functions
  const getActionRender = React.useCallback((action) => (
    <TimelineClip
      clip={clips.find(c => c.id === action.id)}
      action={action}
      isSelected={action.id === selectedClipId}
      onSelect={onClipSelect}
    />
  ), [clips, selectedClipId, onClipSelect]);

  const getScaleRender = React.useCallback((time) => formatTime(time), []);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      <TimelineControls
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {error && (
        <Typography 
          color="error" 
          variant="caption" 
          sx={{ p: 1, bgcolor: 'error.light' }}
        >
          {error}
        </Typography>
      )}

      <ReactTimelineEditor
        editorData={editorData}
        effects={effects}
        onChange={handleChange}
        getActionRender={getActionRender}
        getScaleRender={getScaleRender}
        style={{ 
          height: '100%',
          '--timeline-background-color': 'transparent',
          '--timeline-row-height': `${DEFAULT_ROW_HEIGHT}px`,
        }}
        rowHeight={DEFAULT_ROW_HEIGHT}
        scaleWidth={160 * scale}
        scale={1}
        minScaleCount={20}
        scaleSplitCount={10}
        autoScroll={true}
        gridSnap={true}
        dragLine={true}
        onActionMoveStart={({ action }) => {
          onClipSelect?.(action.id);
        }}
      />
    </Box>
  );
};

export default Timeline;