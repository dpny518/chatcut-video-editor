// src/components/Timeline/index.js
import React, { useEffect } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import { useTimelineExport } from './TimelineExport';
import { 
  useTimelineZoom,
  useTimelineData,
  useTimelineHandlers,
  useTimelineResize,
  useTimelineContextMenu
} from '../../hooks/useTimeline';
import { recalculateTimelineState } from '../../utils/timelineStateUtils';
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
  timelineRows,
  setTimelineRows,
}) => {
  const { scale, handleZoomIn, handleZoomOut } = useTimelineZoom();
  const { editorData, effects, error } = useTimelineData(clips, onClipsChange);
  const { 
    handleChange,
    handleMoveStart,
    handleMoving,
    handleMoveEnd 
  } = useTimelineHandlers(clips, onClipsChange, onClipSelect);
  const {
    handleResizeStart,
    handleResizing,
    handleResizeEnd
  } = useTimelineResize(clips, onClipsChange, onClipSelect);
  const {
    contextMenu,
    selectedActionId,
    setContextMenu,
    setSelectedActionId,
    handleContextMenu
  } = useTimelineContextMenu(onClipSelect);

  // Log incoming clips
  useEffect(() => {
    if (clips.length > 0) {
      const lastClip = clips[clips.length - 1];
      console.log('Latest clip:', {
        clipData: lastClip,
        trimmedPortion: {
          start: lastClip.startTime,
          end: lastClip.endTime,
          duration: lastClip.duration
        },
        sourceInfo: lastClip.source
      });
    }
  }, [clips]);

  // Delete handler
  const handleDelete = React.useCallback(() => {
    if (selectedActionId) {
      const newClips = clips.filter(clip => clip.id !== selectedActionId);
      const updatedClips = recalculateTimelineState(newClips);
      
      const updatedTimelineRows = timelineRows.map(row => {
        const rowClips = updatedClips.filter(clip => 
          clip.metadata.timeline.row === row.rowId
        );
        return {
          ...row,
          clips: rowClips,
          lastEnd: rowClips.length > 0 
            ? Math.max(...rowClips.map(clip => clip.metadata.timeline.end))
            : 0
        };
      });
      
      setTimelineRows(updatedTimelineRows);
      onClipsChange(updatedClips);
      setContextMenu(null);
      setSelectedActionId(null);
    }
  }, [clips, selectedActionId, onClipsChange, setTimelineRows, timelineRows,setContextMenu,setSelectedActionId]);

  // Keyboard delete handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        const newClips = clips.filter(clip => clip.id !== selectedClipId);
        onClipsChange(newClips);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clips, selectedClipId, onClipsChange]);

  // Timeline state
  const timelineState = {
    clips: clips.map(clip => ({
      ...clip,
      timelinePosition: clip.metadata?.timeline || {}
    })),
    totalDuration: editorData.duration,
    settings: { scale, effects }
  };

  const { exportTimelineData } = useTimelineExport(timelineState);

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
      backgroundColor: '#1a1a1a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <TimelineControls
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        timelineState={timelineState} 
        selectedClipId={selectedClipId} 
        onDownloadState={exportTimelineData}
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
        borderBottom: '3px solid rgba(255,255,255,0.25)',
        boxShadow: 'inset 0 -4px 6px -4px rgba(0,0,0,0.3)',
        padding: '0 0 16px 0',
        marginBottom: '16px',
        ...scrollbarStyles,
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
          onActionMoveStart={handleMoveStart}
          onActionMoving={handleMoving}
          onActionMoveEnd={handleMoveEnd}
          onActionResizeStart={handleResizeStart}
          onActionResizing={handleResizing}
          onActionResizeEnd={handleResizeEnd}
          allowOverlap={true}
          pushOnOverlap={true}
          allowResizeStart={true}
          allowResizeEnd={true}
          resizeMin={0.1}
          showResizeIndicator={true}
          gridSnap={true}
          dragLine={true}
          autoScroll={true}
          scaleWidth={160 * scale}
          scale={1}
          minScaleCount={20}
          scaleSplitCount={10}
          snapThreshold={5}
          hideCursor={true}
          getActionRender={(action, row) => (
            <Box onContextMenu={(e) => handleContextMenu(e, action)}>
              <TimelineClip
                clip={action.data || clips.find(c => c.id === action.id)}
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
            paddingBottom: '20px',
          }}
          customStyle={{
            ...customTimelineStyles,
            containerStyle: {
              ...customTimelineStyles.containerStyle,
              borderBottom: '3px solid rgba(255,255,255,0.25)',
              boxShadow: 'inset 0 -4px 6px -4px rgba(0,0,0,0.3)',
            }
          }}
          rowHeight={ROW_HEIGHT}
          allowVerticalDrag={true}
          verticalDragThreshold={10}
          showDragIndicator={true}
          dragRowHeight={ROW_HEIGHT}
          disableDragOverlay={true}
        />
      </Box>

      <Menu
        open={!!contextMenu}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.y, left: contextMenu.x } : null}
      >
        <MenuItem onClick={handleDelete}>Delete Clip</MenuItem>
      </Menu>
    </Box>
  );
};

export default Timeline;