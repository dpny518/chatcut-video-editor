import React from 'react';
import '../styles/Clip.css';

const Clip = ({ clip, onSelect, onUpdate, onRemove }) => {
  const handleStartTimeChange = (e) => {
    onUpdate({ ...clip, startTime: parseFloat(e.target.value) });
  };

  const handleEndTimeChange = (e) => {
    onUpdate({ ...clip, endTime: parseFloat(e.target.value) });
  };

  return (
    <div className="clip" onClick={() => onSelect(clip)}>
      <input
        type="number"
        value={clip.startTime}
        onChange={handleStartTimeChange}
        step="0.1"
      />
      <input
        type="number"
        value={clip.endTime}
        onChange={handleEndTimeChange}
        step="0.1"
      />
      <button onClick={onRemove}>Remove</button>
    </div>
  );
};

export default Clip;