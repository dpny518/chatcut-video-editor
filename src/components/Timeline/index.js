// src/components/Timeline/index.js
import React, { useCallback } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import { useTimelineExport } from './TimelineExport';
import { useTimelineZoom } from '../../hooks/useTimeline/useTimelineZoom';
import { useTimelineData } from '../../hooks/useTimeline/useTimelineData';
import { formatTime } from '../../utils/formatters';
import { scrollbarStyles } from './styles/scrollbarStyles';
import { timelineEditorStyles, customTimelineStyles } from './styles/timelineStyles';
import { useTimelineStateManager } from '../../hooks/useTimeline/useTimelineStateManager';

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
  const { 
    startClipModification,
    completeModification
  } = useTimelineStateManager();
  
  // Context menu state
  const [contextMenu, setContextMenu] = React.useState(null);
  const [selectedActionId, setSelectedActionId] = React.useState(null);

  // Enhanced clip modification handling with logging
  // Enhanced trim start handler
  const handleTrimStart = useCallback(({ action, event }) => {
    console.log('=== TRIM START HANDLER ===');
    console.log('Action:', {
      id: action.id,
      start: action.start.toFixed(3),
      end: action.end.toFixed(3),
      duration: (action.end - action.start).toFixed(3)
    });

    startClipModification(action.id, 'TRIMMING');
    return action;
  }, [startClipModification]);


  // Enhanced trim end handler
  const handleTrimEnd = useCallback(({ action }) => {
    console.log('=== TRIM END HANDLER ===');
    console.log('Final Action State:', {
      id: action.id,
      start: action.start.toFixed(3),
      end: action.end.toFixed(3),
      duration: (action.end - action.start).toFixed(3)
    });

    completeModification(action.id);
    return action;
  }, [completeModification]); // Remove timelineManager.clips dependency



    // Add timeline state export functionality
    const timelineState = {
      clips,
      totalDuration: editorData.duration,
      settings: {
        scale,
        effects
      }
    };
  
    const { exportTimelineData } = useTimelineExport(timelineState);

  // Enhanced debug handler
  const handleDebug = useCallback(() => {
    console.log('=== DEBUG TIMELINE STATE ===');
    console.log('Current Clips:', clips);
    console.log('Selected Clip ID:', selectedClipId);
    console.log('Editor Data:', editorData);
    console.log('Effects:', effects);
    console.log('Scale:', scale);
  }, [clips, selectedClipId, editorData, effects, scale]);

  // Enhanced context menu handler with logging
  const handleContextMenu = useCallback((e, action) => {
    console.log('=== CONTEXT MENU HANDLER ===');
    console.log('Action:', action);
    
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedActionId(action.id);
    onClipSelect?.(action.id);
    
    console.log('Context Menu State:', {
      position: { x: e.clientX, y: e.clientY },
      selectedActionId: action.id
    });
  }, [onClipSelect]);

  // Enhanced delete handler with logging
  const handleDelete = useCallback(() => {
    console.log('=== DELETE HANDLER ===');
    console.log('Selected Action ID:', selectedActionId);
    
    if (selectedActionId) {
      const newClips = clips.filter(clip => clip.id !== selectedActionId);
      console.log('Updated Clips:', newClips);
      
      onClipsChange(newClips);
      setContextMenu(null);
      setSelectedActionId(null);
    }
  }, [clips, selectedActionId, onClipsChange]);

  // Enhanced keyboard delete handler with logging
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        console.log('=== KEYBOARD DELETE HANDLER ===');
        console.log('Key pressed:', e.key);
        console.log('Selected Clip ID:', selectedClipId);
        
        const newClips = clips.filter(clip => clip.id !== selectedClipId);
        console.log('Updated Clips:', newClips);
        
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
      backgroundColor: '#1a1a1a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <TimelineControls
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onDownloadState={exportTimelineData}
        onDebugClips={handleDebug}
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
          onActionResizeStart={handleTrimStart}
          onActionResizeEnd={handleTrimEnd}
          allowResizeStart={true}
          allowResizeEnd={true}
          resizeMin={0.1}
          showResizeIndicator={true}
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
};

export default Timeline;