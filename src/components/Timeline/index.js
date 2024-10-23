// src/components/Timeline/index.js
import React, { useCallback } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import { useTimelineZoom } from '../../hooks/useTimeline/useTimelineZoom';
import { useTimelineData } from '../../hooks/useTimeline/useTimelineData';
import { formatTime } from '../../utils/formatters';
import { scrollbarStyles } from './styles/scrollbarStyles';
import { timelineEditorStyles, customTimelineStyles } from './styles/timelineStyles';
const ROW_HEIGHT = 64;
const MIN_ROWS = 10;

const Timeline = ({ 
  clips = [], 
  onClipsChange,
  selectedClipId,
  onClipSelect,
}) => {
  const { scale, handleZoomIn, handleZoomOut } = useTimelineZoom();
  const { editorData, effects, error, handleChange } = useTimelineData(clips, onClipsChange);
 
  // Context menu state
  const [contextMenu, setContextMenu] = React.useState(null);
  const [selectedActionId, setSelectedActionId] = React.useState(null);

  // Handle clip dragging between rows
  const handleActionDrag = useCallback(({ action, newRowIndex }) => {
    return {
      ...action,
      effectId: action.effectId || 'default',
      data: {
        ...action.data,
        rowIndex: newRowIndex
      }
    };
  }, []);

  // Handle context menu
  const handleContextMenu = useCallback((e, action) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedActionId(action.id);
    onClipSelect?.(action.id);
  }, [onClipSelect]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedActionId) {
      const newClips = clips.filter(clip => clip.id !== selectedActionId);
      onClipsChange(newClips);
      setContextMenu(null);
      setSelectedActionId(null);
    }
  }, [clips, selectedActionId, onClipsChange]);

  // Handle keyboard delete
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        const newClips = clips.filter(clip => clip.id !== selectedClipId);
        onClipsChange(newClips);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clips, selectedClipId, onClipsChange]);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: `${ROW_HEIGHT * MIN_ROWS}px`,
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '4px 4px 0 0',
      mb: 2,
      overflow: 'hidden',
      // Enhanced container styles
      backgroundColor: '#1a1a1a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
  
      <Box sx={{ 
        flex: 1,
        minHeight: `${ROW_HEIGHT * MIN_ROWS}px`,
        overflow: 'scroll',
        position: 'relative',
        // Enhanced bottom border and shadow
        borderBottom: '3px solid rgba(255,255,255,0.25)',
        boxShadow: 'inset 0 -4px 6px -4px rgba(0,0,0,0.3)',
        // Spacing for scrollbars
        padding: '0 0 16px 0',
        marginBottom: '16px',
        // Combine with existing scrollbar styles
        ...scrollbarStyles,
        // Additional scrollbar enhancements
        '&::-webkit-scrollbar-track': {
          ...scrollbarStyles['&::-webkit-scrollbar-track'],
          margin: '4px',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)',
        },
        '&::-webkit-scrollbar-thumb': {
          ...scrollbarStyles['&::-webkit-scrollbar-thumb'],
          border: '4px solid #1a1a1a',
          minHeight: '40px',
        },
        // Enhanced corner treatment
        '&::-webkit-scrollbar-corner': {
          ...scrollbarStyles['&::-webkit-scrollbar-corner'],
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }
      }}>
        <ReactTimelineEditor
          editorData={editorData}
          effects={effects}
          onChange={handleChange}
          getActionRender={(action, row) => (
            <Box onContextMenu={(e) => handleContextMenu(e, action)}>
              <TimelineClip
                clip={action.data}
                action={action}
                row={row}
                isSelected={action.id === selectedClipId}
                onSelect={onClipSelect}
              />
            </Box>
          )}
          getScaleRender={formatTime}
          style={{
            ...timelineEditorStyles,
            // Ensure proper spacing for scrollbar buttons
            paddingBottom: '20px',
          }}
          customStyle={{
            ...customTimelineStyles,
            // Enhanced container style
            containerStyle: {
              ...customTimelineStyles.containerStyle,
              borderBottom: '3px solid rgba(255,255,255,0.25)',
              boxShadow: 'inset 0 -4px 6px -4px rgba(0,0,0,0.3)',
            }
          }}
          rowHeight={ROW_HEIGHT}
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
          onActionDrag={handleActionDrag}
          allowVerticalDrag={true}
          verticalDragThreshold={10}
          showDragIndicator={true}
          dragRowHeight={ROW_HEIGHT}
          disableDrag={false}
        />
  
        <Menu
          open={Boolean(contextMenu)}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu 
              ? { top: contextMenu.y, left: contextMenu.x } 
              : undefined
          }
        >
          <MenuItem 
            onClick={handleDelete}
            sx={{ 
              color: 'error.main', 
              '&:hover': { 
                bgcolor: 'error.dark', 
                color: 'white' 
              }
            }}
          >
            Delete Clip
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

export default Timeline;