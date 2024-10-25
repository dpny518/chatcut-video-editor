// src/components/Timeline/index.js
import React, { useCallback, useState, useEffect } from 'react';
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

const ROW_HEIGHT = 64;
const MIN_ROWS = 10;

const Timeline = ({ 
  clips = [], 
  onClipsChange,
  selectedClipId,
  onClipSelect,
}) => {
  const { scale, handleZoomIn, handleZoomOut } = useTimelineZoom();
  const { editorData, effects, error } = useTimelineData(clips, onClipsChange);

    // Add context menu state
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedActionId, setSelectedActionId] = useState(null);

// Log incoming clips
useEffect(() => {
  if (clips.length > 0) {
    console.log('Timeline clips:', clips);
    // Log the last added clip
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

  // Handle move start
const handleMoveStart = useCallback(({ action, row }) => {
  console.log('Move Start:', { action, row });
  
  // Store initial state like we do in resize
  action.data = {
    ...action.data,
    initialStart: action.start,
    initialEnd: action.end,
    metadata: {
      ...action.data.metadata,
      timeline: {
        start: action.start,
        end: action.end,
        duration: action.end - action.start
      }
    }
  };
  
  onClipSelect?.(action.id);
}, [onClipSelect]);
  // Handle move
 // Handle move
const handleMoving = useCallback(({ action, row, start, end }) => {
  console.log('Moving:', { action, start, end });
  
  action.data = {
    ...action.data,
    metadata: {
      ...action.data.metadata,
      timeline: {
        start,
        end,
        duration: end - start
      }
    }
  };
  
  return true;
}, []);

 // Handle move end
const handleMoveEnd = useCallback(({ action, row, start, end }) => {
  console.log('Move End:', { action, start, end });
  
  const updatedClips = clips.map(clip => {
    if (clip.id === action.id) {
      return {
        ...clip,
        ...action.data,  // Include the updated data like we do in resize
        metadata: {
          ...action.data.metadata,
          timeline: {
            start,
            end,
            duration: end - start
          }
        }
      };
    }
    return clip;
  });

  onClipsChange(updatedClips);
}, [clips, onClipsChange]);



// Handle resize start
const handleResizeStart = useCallback(({ action, row, dir }) => {
  console.log('Resize Start:', { action, dir });
  
  // Update the action data with the resize direction
  action.data = {
    ...action.data,
    resizeDir: dir
  };
  
  onClipSelect?.(action.id);
}, [onClipSelect]);

// Handle resizing
const handleResizing = useCallback(({ action, row, start, end, dir }) => {
  console.log('Resizing:', { action, start, end, dir });
  
  // Get source video bounds
  const sourceStart = action.data.source.startTime; // 0
  const sourceEnd = action.data.source.endTime;     // 42.944
  console.log(sourceStart)
  console.log(sourceEnd)
  // Check bounds based on direction
  if (dir === 'left' && start < sourceStart) {
    return false; // Prevent going before video start
  }
  if (dir === 'right' && end > sourceEnd) {
    return false; // Prevent going past video end
  }
  
  // Allow resize if within bounds
  action.data = {
    ...action.data,
    resizeDir: dir
  };
  
  return true;
}, []);

// Handle resize end
const handleResizeEnd = useCallback(({ action, row, start, end, dir }) => {
console.log('Resize End:', { action, start, end, dir });

const updatedClips = clips.map(clip => {
  if (clip.id === action.id) {
      // Use all the data we calculated during resize
      return {
          ...clip,
          ...action.data,  // This includes the updated startTime, endTime
          metadata: {
              ...action.data.metadata,  // Use the metadata we calculated during resize
              timeline: {
                  start,
                  end,
                  duration: end - start
              }
          }
      };
  }
  return clip;
});

onClipsChange(updatedClips);
}, [clips, onClipsChange]);

  // Handle general changes
  const handleChange = useCallback((newEditorData) => {
    console.log('Timeline Changed:', newEditorData);
    
    if (!newEditorData?.actions) return;

    const updatedClips = clips.map(clip => {
      const action = newEditorData.actions.find(a => a.id === clip.id);
      if (!action) return clip;

      return {
        ...clip,
        metadata: action.data?.metadata || clip.metadata
      };
    });

    onClipsChange(updatedClips);
  }, [clips, onClipsChange]);

  // Timeline state export functionality
  const timelineState = {
    clips,
    totalDuration: editorData.duration,
    settings: { scale, effects }
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

  // Context menu handler with logging
  const handleContextMenu = useCallback((e, action) => {
    console.log('=== CONTEXT MENU HANDLER ===');
    console.log('Action:', action);
    
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedActionId(action.id);
    onClipSelect?.(action.id);
    
    console.log('Context Menu State:', { position: { x: e.clientX, y: e.clientY }, selectedActionId: action.id });
  }, [onClipSelect]);

  // Delete handler with logging
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

  // Keyboard delete handler with logging
  useEffect(() => {
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
        timelineState={timelineState} 
        selectedClipId={selectedClipId} 
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
        // Move handlers
        onActionMoveStart={handleMoveStart}
        onActionMoving={handleMoving}
        onActionMoveEnd={handleMoveEnd}
        // Resize handlers
        onActionResizeStart={handleResizeStart}
        onActionResizing={handleResizing}
        onActionResizeEnd={handleResizeEnd}
        // Other props
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

      {/* Context Menu */}
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
