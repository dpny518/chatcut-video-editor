// src/components/Timeline/index.js
import React, { useCallback, useState, useEffect } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import TimelineViewerSection from '../Viewers/TimelineViewerSection';
import { formatTime } from '../../utils/formatters';
import { scrollbarStyles } from './styles/scrollbarStyles';
import { timelineEditorStyles, customTimelineStyles } from './styles/timelineStyles';
import useTimelineStore from '../../stores/timelineStore';
import useMediaStore from '../../stores/mediaStore';

const ROW_HEIGHT = 64;
const MIN_ROWS = 10;

const Timeline = () => {
  const {
    clips,
    selectedClipId,
    scale,
    effects,
    error,
    editorData,
    setSelectedClipId,
    updateEditorData,
    moveClip,
    resizeClip,
    removeClip,
    updateTimelineState,
    getTimelineState
  } = useTimelineStore();

  const { setNotification } = useMediaStore();

  const [contextMenu, setContextMenu] = useState(null);

  const handleMoveStart = useCallback(({ action }) => {
    setSelectedClipId(action.id);
  }, [setSelectedClipId]);

  const handleMoving = useCallback(({ action, start, end }) => {
    const clip = clips.find(c => c.id === action.id);
    if (!clip) return false;

    if (start < 0) return false;

    moveClip(action.id, start, end);
    return true;
  }, [clips, moveClip]);

  const handleResizeStart = useCallback(({ action, dir }) => {
    setSelectedClipId(action.id);
  }, [setSelectedClipId]);

  const handleResizing = useCallback(({ action, start, end, dir }) => {
    resizeClip(action.id, start, end, dir);
    return true;
  }, [resizeClip]);

  const handleChange = useCallback((newEditorData) => {
    if (!newEditorData?.actions) return;
    updateEditorData(newEditorData);
  }, [updateEditorData]);

  const handleContextMenu = useCallback((e, action) => {
    e.preventDefault();
    setContextMenu({ 
      x: e.clientX, 
      y: e.clientY, 
      clipId: action.id 
    });
    setSelectedClipId(action.id);
  }, [setSelectedClipId]);

  const handleDelete = useCallback(() => {
    if (contextMenu?.clipId) {
      removeClip(contextMenu.clipId);
      setNotification('Clip removed from timeline', 'success');
      setContextMenu(null);
    }
  }, [contextMenu, removeClip, setNotification]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        removeClip(selectedClipId);
        setNotification('Clip removed from timeline', 'success');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, removeClip, setNotification]);

  if (!clips.length) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 4,
        textAlign: 'center',
        color: 'text.secondary'
      }}>
        <TimelineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No Clips in Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload media files and add clips to get started
        </Typography>
      </Box>
    );
  }

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
        selectedClipId={selectedClipId}
        timelineState={getTimelineState()}
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
        ...scrollbarStyles
      }}>
        <ReactTimelineEditor
          editorData={editorData}
          effects={effects}
          onChange={handleChange}
          onActionMoveStart={handleMoveStart}
          onActionMoving={handleMoving}
          onActionResizeStart={handleResizeStart}
          onActionResizing={handleResizing}
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
          getActionRender={(action, row) => (
            <Box onContextMenu={(e) => handleContextMenu(e, action)}>
              <TimelineClip
                clip={action.data || clips.find(c => c.id === action.id)}
                action={action}
                row={row}
                isSelected={action.id === selectedClipId}
                onSelect={setSelectedClipId}
              />
            </Box>
          )}
          getScaleRender={formatTime}
          style={timelineEditorStyles}
          customStyle={customTimelineStyles}
          rowHeight={ROW_HEIGHT}
          allowVerticalDrag={true}
          verticalDragThreshold={10}
          showDragIndicator={true}
          dragRowHeight={ROW_HEIGHT}
          disableDragOverlay={true}
        />
        
        <TimelineViewerSection
          currentClip={clips.find(clip => clip.id === selectedClipId)}
          sx={{ 
            height: 300,
            mt: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1
          }}
        />
      </Box>

      <Menu
        open={!!contextMenu}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? 
            { top: contextMenu.y, left: contextMenu.x } : 
            undefined
        }
      >
        <MenuItem onClick={handleDelete}>Delete Clip</MenuItem>
      </Menu>
    </Box>
  );
};

export default Timeline;
