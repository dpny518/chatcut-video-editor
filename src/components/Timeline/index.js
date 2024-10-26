// src/components/Timeline/index.js
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Maximize2, Minimize2, ArrowUpRight, Link } from 'lucide-react';
import TimelineControls from './TimelineControls';
import TimelineClip from './TimelineClip';
import ReferenceIndicator from './TimelineReference/ReferenceIndicator';
import { useTimelineExport } from './TimelineExport';
import { useTimelineZoom } from '../../hooks/useTimeline/useTimelineZoom';
import { useTimelineData } from '../../hooks/useTimeline/useTimelineData';
import { formatTime } from '../../utils/formatters';
import { scrollbarStyles } from './styles/scrollbarStyles';
import { timelineEditorStyles, customTimelineStyles } from './styles/timelineStyles';

const ROW_HEIGHT = 64;
const MIN_ROWS = 10;

const Timeline = ({ 
  timeline = null,  // Provide default null value
  onTimelineChange = () => {},
  selectedClipId = null,
  onClipSelect = () => {},
  onCreateReference = () => {},
  isMaximized = false,
  onToggleMaximize = () => {},
  height = null,
  references = [],
  timelineIndex = 0
}) => {
  

  // State management
  const { scale, handleZoomIn, handleZoomOut } = useTimelineZoom();
  const { editorData, effects, error } = useTimelineData(timeline?.clips || [], onTimelineChange);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState(null);

  // Calculate dynamic sizing
  const timelineHeight = height || `${ROW_HEIGHT * MIN_ROWS}px`;
  const minHeight = `${ROW_HEIGHT * 3}px`; // Minimum 3 rows

  // Reference tracking with null checks
  const hasReferences = Array.isArray(references) && references.length > 0;
  const referencedClips = new Set(hasReferences ? references.map(ref => ref?.clipId).filter(Boolean) : []);

   // Create a properly initialized editor data object
   const initializedEditorData = useMemo(() => ({
    ...editorData,
    actions: editorData.actions || [],
    rows: editorData.rows || [{ id: 'row-1' }],
    duration: editorData.duration || 300, // Default 5 minutes in seconds
    startAt: editorData.startAt || 0,
    endAt: editorData.endAt || 300,
  }), [editorData]);

  // Log timeline changes
  useEffect(() => {
    if (timeline?.clips?.length > 0) {
      console.log(`Timeline ${timeline.id} clips:`, timeline.clips);
      const lastClip = timeline.clips[timeline.clips.length - 1];
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
  }, [timeline?.clips]);

  // Movement handlers with reference validation
  const handleMoveStart = useCallback(({ action, row }) => {
    console.log('Move Start:', { action, row });
    
    // Check if clip is referenced
    if (referencedClips.has(action.id)) {
      console.log('Moving referenced clip:', action.id);
    }
    
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
  }, [onClipSelect, referencedClips]);

 // Handle move
const handleMoving = useCallback(({ action, row, start, end }) => {
  console.log('Moving:', { action, start, end });
  
  // Update both timeline and playback metadata during move
  action.data = {
    ...action.data,
    metadata: {
      ...action.data.metadata,
      timeline: {
        start,
        end,
        duration: end - start,
        initialStart: action.data.metadata?.timeline?.initialStart
      },
      playback: {
        start: action.data.metadata?.playback?.start || action.data.startTime,
        end: action.data.metadata?.playback?.end || action.data.endTime,
        duration: action.data.metadata?.playback?.duration || (action.data.endTime - action.data.startTime)
      }
    }
  };
  console.log('Moving clip:', {
    timeline: { start, end, duration: end - start },
    playback: { 
      start: action.data.metadata?.playback?.start || action.data.startTime,
      end: action.data.metadata?.playback?.end || action.data.endTime 
    }
  });
  
  return true;
}, []);

 // Handle move end
const handleMoveEnd = useCallback(({ action, row, start, end }) => {
  console.log('Move End:', { action, start, end });

  const updatedClips = (timeline?.clips || []).map(clip => {
    if (clip.id === action.id) {
      const actionData = action.data || {};
      const metadata = actionData.metadata || {};
      const playback = metadata.playback || {};
      return {
        ...clip,
        ...actionData,
        startTime: playback.start || clip.startTime,
        endTime: playback.end || clip.endTime,
        metadata: {
          ...metadata,
          timeline: {
            ...metadata.timeline,
            start,
            end,
            duration: end - start
          }
        }
      };
    }
    return clip;
  });

  onTimelineChange({ ...timeline, clips: updatedClips });
}, [timeline, onTimelineChange]);

// Handle resize start
const handleResizeStart = useCallback(({ action, row, dir }) => {
  console.log('Resize Start:', { action, dir });
  
  action.data = {
    ...action.data,
    resizeDir: dir
  };
  
  onClipSelect?.(action.id);
}, [onClipSelect]);

// Handle resizing
const handleResizing = useCallback(({ action, row, start, end, dir }) => {
  console.log('Resizing:', { action, start, end, dir });

  const sourceStart = action.data.source.startTime;
  const sourceEnd = action.data.source.endTime;

  if (dir === 'left' && start < sourceStart) {
    return false;
  }
  if (dir === 'right' && end > sourceEnd) {
    return false;
  }

  let playbackStart = action.data.metadata?.playback?.start || action.data.startTime;
  let playbackEnd = action.data.metadata?.playback?.end || action.data.endTime;
  const timelineDuration = end - start;

  if (dir === 'left') {
    playbackEnd = action.data.metadata?.playback?.end || action.data.endTime;
    playbackStart = playbackEnd - timelineDuration;
  } else if (dir === 'right') {
    playbackStart = action.data.metadata?.playback?.start || action.data.startTime;
    playbackEnd = playbackStart + timelineDuration;
  }

  playbackStart = Math.max(playbackStart, sourceStart);
  playbackEnd = Math.min(playbackEnd, sourceEnd);

  action.data = {
    ...action.data,
    resizeDir: dir,
    metadata: {
      ...action.data.metadata,
      timeline: {
        start,
        end,
        duration: end - start,
      },
      playback: {
        start: playbackStart,
        end: playbackEnd,
        duration: playbackEnd - playbackStart
      }
    }
  };

  console.log('Updated clip timing:', {
    timeline: { start, end, duration: end - start },
    playback: { start: playbackStart, end: playbackEnd, duration: playbackEnd - playbackStart }
  });

  return true;
}, []);

// Handle resize end
const handleResizeEnd = useCallback(({ action, row, start, end, dir }) => {
  console.log('Resize End:', { action, start, end, dir });

  const sourceStart = action.data.source.startTime;
  const sourceEnd = action.data.source.endTime;

  start = Math.max(start, sourceStart);
  end = Math.min(end, sourceEnd);

  const updatedClips = (timeline?.clips || []).map(clip => {
    if (clip.id === action.id) {
      const actionData = action.data || {};
      const metadata = actionData.metadata || {};
      const playback = metadata.playback || {};

      return {
        ...clip,
        ...actionData,
        startTime: playback.start || clip.startTime,
        endTime: playback.end || clip.endTime,
        metadata: {
          ...metadata,
          timeline: {
            ...metadata.timeline,
            start,
            end, 
            duration: end - start
          }
        }
      };
    }
    return clip;
  });
  
  onTimelineChange({ ...timeline, clips: updatedClips });
}, [timeline, onTimelineChange]);

// Handle general changes
const handleChange = useCallback((newEditorData) => {
  console.log('Timeline Changed:', newEditorData);
  
  if (!newEditorData?.actions) return;

  const updatedClips = (timeline?.clips || []).map(clip => {
    const action = newEditorData.actions.find(a => a.id === clip.id);
    if (!action) return clip;

    const actionData = action.data || {};
    const metadata = actionData.metadata || {};
    const timelineData = metadata.timeline || {};
    const playback = metadata.playback || {};

    const timelineDuration = action.end - action.start;

    return {
      ...clip,
      ...actionData,
      startTime: playback.start || clip.startTime,
      endTime: playback.end || clip.endTime,
      metadata: {
        ...metadata,
        timeline: {
          ...timelineData,
          start: action.start,
          end: action.end,
          duration: timelineDuration,
        },
        playback: {
          start: playback.start || clip.startTime,
          end: playback.end || clip.endTime,
          duration: playback.duration || (playback.end - playback.start)
        }
      }
    };
  });

  onTimelineChange({ ...timeline, clips: updatedClips });
}, [timeline, onTimelineChange]);

// Timeline state export functionality
const timelineState = {
  clips: (timeline?.clips || []).map(clip => ({
    ...clip,
    timelinePosition: clip.metadata?.timeline || {}
  })),
  totalDuration: editorData.duration,
  settings: { scale, effects }
};

const { exportTimelineData } = useTimelineExport(timelineState);

// Enhanced debug handler
const handleDebug = useCallback(() => {
  console.log('=== DEBUG TIMELINE STATE ===');
  console.log('Current Clips:', timeline?.clips);
  console.log('Selected Clip ID:', selectedClipId);
  console.log('Editor Data:', editorData);
  console.log('Effects:', effects);
  console.log('Scale:', scale);
}, [timeline?.clips, selectedClipId, editorData, effects, scale]);

/// Handle context menu with null checks
const handleContextMenu = useCallback((e, action) => {
  if (!action?.id) return;
  
  e.preventDefault();
  setContextMenu({ x: e.clientX, y: e.clientY });
  setSelectedActionId(action.id);
  onClipSelect?.(action.id);
}, [onClipSelect]);

// Handle create reference with validation
const handleCreateReference = useCallback(() => {
  if (!selectedActionId || !timeline?.id) return;
  
  onCreateReference?.(timeline.id, selectedActionId);
  setContextMenu(null);
}, [selectedActionId, timeline?.id, onCreateReference]);

// Handle delete with validation
const handleDelete = useCallback(() => {
  if (!selectedActionId || !timeline?.clips) return;
  
  const newClips = timeline.clips.filter(clip => clip.id !== selectedActionId);
  onTimelineChange({ ...timeline, clips: newClips });
  setContextMenu(null);
  setSelectedActionId(null);
}, [timeline, selectedActionId, onTimelineChange]);

// Keyboard delete handler with logging
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
      console.log('=== KEYBOARD DELETE HANDLER ===');
      console.log('Key pressed:', e.key);
      console.log('Selected Clip ID:', selectedClipId);
      
      const newClips = (timeline?.clips || []).filter(clip => clip.id !== selectedClipId);
      console.log('Updated Clips:', newClips);
      onTimelineChange({ ...timeline, clips: newClips });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [timeline, selectedClipId, onTimelineChange]);



return (
  <Box sx={{ 
    display: 'flex',
    flexDirection: 'column',
    height: isMaximized ? '100%' : timelineHeight,
    minHeight,
    position: 'relative',
    border: theme => `1px solid ${theme.palette.divider}`,
    borderRadius: '4px',
    overflow: 'hidden',
    bgcolor: 'background.paper',
    transition: 'height 0.3s ease',
  }}>
    {/* Timeline Header */}
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 2,
      py: 1,
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2">
          Timeline {timelineIndex + 1}
        </Typography>
        {hasReferences && (
          <Tooltip title="Has Referenced Clips">
            <Link size={16} className="text-blue-400" />
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TimelineControls
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          timelineState={timeline} 
          selectedClipId={selectedClipId}
          compact={!isMaximized}
        />
        <Tooltip title={isMaximized ? "Minimize" : "Maximize"}>
          <IconButton size="small" onClick={onToggleMaximize}>
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>

    {/* Error Display */}
    {error && (
      <Typography 
        color="error" 
        variant="caption" 
        sx={{ p: 1, bgcolor: 'error.light' }}
      >
        {error}
      </Typography>
    )}

    {/* Timeline Editor */}
    {timeline?.clips && (
      <Box sx={{ 
        flex: 1,
        minHeight: minHeight,
        overflow: 'auto',
        position: 'relative',
        ...scrollbarStyles
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
            <Box 
              onContextMenu={(e) => handleContextMenu(e, action)}
              sx={{ position: 'relative' }}
            >
              <TimelineClip
                clip={action.data || timeline.clips?.find(c => c?.id === action.id)}
                action={action}
                row={row}
                isSelected={action.id === selectedClipId}
                onSelect={onClipSelect}
              />
              {referencedClips.has(action.id) && (
                <ReferenceIndicator
                  sourceType="timeline"
                  sourceId={timeline.id}
                  referenceData={references.find(ref => ref?.clipId === action.id)}
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                />
              )}
            </Box>
          )}
          getScaleRender={formatTime}
          style={timelineEditorStyles}
          customStyle={{
            ...customTimelineStyles,
            containerStyle: {
              ...customTimelineStyles.containerStyle,
              height: '100%'
            },
            emptyAreaStyle: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              fontSize: '0.875rem',
              backgroundColor: 'background.paper'
            }
          }}
          rowHeight={ROW_HEIGHT}
          allowVerticalDrag={true}
          verticalDragThreshold={10}
          showDragIndicator={true}
          dragRowHeight={ROW_HEIGHT}
          emptyAreaText="Drag and drop clips here"
        />
      </Box>
    )}

    {/* Context Menu */}
    {contextMenu && (
      <Menu
        open={true}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <MenuItem 
          onClick={handleCreateReference}
          disabled={!selectedActionId || !timeline?.id}
        >
          Create Reference
        </MenuItem>
        <MenuItem 
          onClick={handleDelete}
          disabled={!selectedActionId || !timeline?.clips}
        >
          Delete Clip
        </MenuItem>
      </Menu>
    )}
  </Box>
);

};

export default Timeline;