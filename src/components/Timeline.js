import React, { useState } from 'react';
import Clip from './Clip';
import '../styles/Timeline.css';

const Timeline = ({ onClipSelect, currentTime, duration }) => {
  const [clips, setClips] = useState([]);

  const addClip = (newClip) => {
    setClips([...clips, newClip]);
  };

  const updateClip = (index, updatedClip) => {
    const newClips = [...clips];
    newClips[index] = updatedClip;
    setClips(newClips);
  };

  const removeClip = (index) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
  };

  return (
    <div className="timeline">
      <h3>Timeline</h3>
      <div className="clips-container">
        {clips.map((clip, index) => (
          <Clip
            key={index}
            clip={clip}
            onSelect={() => onClipSelect(clip)}
            onUpdate={(updatedClip) => updateClip(index, updatedClip)}
            onRemove={() => removeClip(index)}
          />
        ))}
      </div>
      <button onClick={() => addClip({ startTime: 0, endTime: duration, sourceFile: null })}>
        Add Clip
      </button>
    </div>
  );
};

export default Timeline;