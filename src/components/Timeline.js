import React, { useState, useEffect, useCallback } from 'react';
import { Timeline as ReactTimelineEditor } from '@xzdarcy/react-timeline-editor';

const Timeline = ({ clips, onClipsChange }) => {
  const [editorData, setEditorData] = useState([]);
  const [effects, setEffects] = useState({});

  useEffect(() => {
    // Convert clips to the format expected by react-timeline-editor
    let totalDuration = 0;
    const newEditorData = [{
      id: 'main-row',
      actions: clips.map((clip, index) => {
        const action = {
          id: clip.id,
          start: totalDuration,
          end: totalDuration + clip.duration,
          effectId: clip.id,
          movable: clip.movable !== false,
          flexible: clip.flexible !== false,
          minStart: clip.minStart || 0,
          maxEnd: clip.maxEnd || Infinity,
        };
        totalDuration += clip.duration;
        return action;
      }),
    }];
    setEditorData(newEditorData);

    // Create effects object
    const newEffects = clips.reduce((acc, clip) => {
      acc[clip.id] = {
        id: clip.id,
        name: clip.name,
        duration: clip.duration,
      };
      return acc;
    }, {});
    setEffects(newEffects);
  }, [clips]);

  // Handle changes from react-timeline-editor
  const handleChange = useCallback((newEditorData) => {
    if (newEditorData.length === 0 || newEditorData[0].actions.length === 0) return;

    const newClips = newEditorData[0].actions.map((action, index) => ({
      id: action.id,
      name: effects[action.effectId].name,
      startTime: action.start,
      endTime: action.end,
      duration: action.end - action.start,
      file: clips.find((clip) => clip.id === action.id).file,
      movable: action.movable,
      flexible: action.flexible,
      minStart: action.minStart,
      maxEnd: action.maxEnd,
    }));
    onClipsChange(newClips);
  }, [clips, effects, onClipsChange]);

  // Custom render function for actions (clips)
  const getActionRender = useCallback((action, row) => {
    const durationInSeconds = action.end - action.start;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
      <div style={{ 
        height: '100%', 
        backgroundColor: '#3c3c3c',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        padding: '0 8px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}>
        {durationString}
      </div>
    );
  }, []);

  return (
    <ReactTimelineEditor
      editorData={editorData}
      effects={effects}
      onChange={handleChange}
      getActionRender={getActionRender}
      style={{ height: '200px' }}
      rowHeight={50}
    />
  );
};

export default Timeline;