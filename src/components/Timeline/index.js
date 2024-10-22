// src/components/Timeline/index.js
import React, { useCallback } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import { useTimelineZoom } from '../../hooks/useTimeline/useTimelineZoom';
import { useTimelineData } from '../../hooks/useTimeline/useTimelineData';
import { formatTime } from '../../utils/formatters';

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

      <Box sx={{ 
        flex: 1,
        minHeight: `${ROW_HEIGHT * MIN_ROWS}px`,
        overflow: 'auto'
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
            height: '100%',
            '--timeline-background-color': '#1a1a1a',
            '--timeline-row-height': `${ROW_HEIGHT}px`,
            '--timeline-row-padding': '4px',
            '--timeline-header-height': '32px',
            '--timeline-header-background': '#2a2a2a',
            '--timeline-grid-color': 'rgba(255,255,255,0.1)',
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
          customStyle={{
            rowStyle: {
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)'
              }
            },
            actionStyle: {
              margin: '2px 0',
              backgroundColor: '#2d3748',
              borderRadius: '4px',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#3a4657'
              }
            }
          }}
        />

        {/* Context Menu */}
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
              '&:hover': { bgcolor: 'error.dark', color: 'white' }
            }}
          >
            Delete Clip
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Timeline;