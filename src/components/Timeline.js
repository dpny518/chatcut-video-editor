// eslint-disable-next-line
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

// Constants
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const DEFAULT_SCALE = 1;
const DEFAULT_ROW_HEIGHT = 50;
const SCALE_STEP = 0.1;

const Timeline = ({ 
  clips = [], 
  onClipsChange,
  selectedClipId,
  onClipSelect,
  maxTracks = 5
}) => {
  // State
  const [editorData, setEditorData] = useState([]);
  const [effects, setEffects] = useState({});
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [error, setError] = useState(null);

  // Create sequential timeline data
  const createTimelineData = useCallback((clips) => {
    let currentPosition = 0;

    // Create a single track with sequentially positioned clips
    const track = {
      id: 'main-track',
      name: 'Main Track',
      actions: clips.map(clip => {
        const duration = clip.endTime - clip.startTime;
        const action = {
          id: clip.id,
          start: currentPosition,
          end: currentPosition + duration,
          effectId: clip.id,
          movable: true,
          flexible: true,
          duration: duration // Store original duration
        };
        currentPosition += duration; // Move position for next clip
        return action;
      })
    };

    return [track];
  }, []);

  // Update editor data when clips change
  useEffect(() => {
    try {
      if (!clips.length) {
        setEditorData([]);
        setEffects({});
        return;
      }

      // Create timeline data
      const timelineData = createTimelineData(clips);
      setEditorData(timelineData);

      // Create effects object
      const newEffects = clips.reduce((acc, clip) => {
        const duration = clip.endTime - clip.startTime;
        acc[clip.id] = {
          id: clip.id,
          name: clip.name || 'Untitled Clip',
          duration: duration,
        };
        return acc;
      }, {});
      
      setEffects(newEffects);
      setError(null);
    } catch (err) {
      console.error('Error creating timeline:', err);
      setError('Failed to create timeline');
    }
  }, [clips, createTimelineData]);

  // Handle changes from timeline editor
  const handleChange = useCallback((newEditorData) => {
    if (!newEditorData.length || !newEditorData[0].actions) return;

    try {
      // Convert editor data back to clips
      const newClips = newEditorData[0].actions.map(action => {
        const originalClip = clips.find(clip => clip.id === action.id);
        if (!originalClip) return null;

        const duration = action.end - action.start;
        
        return {
          ...originalClip,
          startTime: action.start,
          endTime: action.end,
          duration: duration,
        };
      }).filter(Boolean);

      if (newClips.length > 0) {
        // Sort clips by their position in the timeline
        const sortedClips = [...newClips].sort((a, b) => a.startTime - b.startTime);
        
        // Reposition clips sequentially
        let currentPosition = 0;
        const repositionedClips = sortedClips.map(clip => {
          const duration = clip.endTime - clip.startTime;
          const newClip = {
            ...clip,
            startTime: currentPosition,
            endTime: currentPosition + duration
          };
          currentPosition += duration;
          return newClip;
        });

        onClipsChange?.(repositionedClips);
      }
    } catch (err) {
      console.error('Error updating clips:', err);
      setError('Failed to update timeline');
    }
  }, [clips, onClipsChange]);

  // Custom render function for actions (clips)
  const getActionRender = useCallback((action, row) => {
    const isSelected = action.id === selectedClipId;
    const clip = clips.find(c => c.id === action.id);
    
    if (!clip) return null;

    const duration = action.end - action.start;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          backgroundColor: isSelected ? 'primary.main' : '#3c3c3c',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.dark' : '#4c4c4c',
          },
          overflow: 'hidden'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClipSelect?.(action.id);
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mr: 1
          }}
        >
          {clip.name || 'Untitled'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            flexShrink: 0
          }}
        >
          {durationString}
        </Typography>
      </Box>
    );
  }, [clips, selectedClipId, onClipSelect]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  // Format time for scale
  const getScaleRender = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle drag end to ensure sequential positioning
  const handleActionMoveEnd = useCallback(({ action, start, end }) => {
    const currentActions = editorData[0]?.actions || [];
    const sortedActions = [...currentActions].sort((a, b) => a.start - b.start);
    
    let currentPosition = 0;
    const repositionedActions = sortedActions.map(act => ({
      ...act,
      start: currentPosition,
      end: currentPosition + (act.end - act.start)
    }));

    setEditorData([{
      ...editorData[0],
      actions: repositionedActions
    }]);
  }, [editorData]);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Zoom controls */}
      <Box sx={{ 
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        display: 'flex',
        gap: 0.5,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
      }}>
        <Tooltip title="Zoom Out">
          <IconButton 
            size="small" 
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In">
          <IconButton 
            size="small" 
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error message */}
      {error && (
        <Typography 
          color="error" 
          variant="caption" 
          sx={{ p: 1, bgcolor: 'error.light' }}
        >
          {error}
        </Typography>
      )}

      {/* Timeline editor */}
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
        onActionMoveEnd={handleActionMoveEnd}
      />
    </Box>
  );
};

export default Timeline;