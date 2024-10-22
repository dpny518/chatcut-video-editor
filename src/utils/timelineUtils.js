export const createTimelineData = (clips) => {
  let currentPosition = 0;
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
        duration: duration
      };
      currentPosition += duration;
      return action;
    })
  };
  return [track];
};

export const createEffects = (clips) => {
  return clips.reduce((acc, clip) => {
    const duration = clip.endTime - clip.startTime;
    acc[clip.id] = {
      id: clip.id,
      name: clip.name || 'Untitled Clip',
      duration: duration,
    };
    return acc;
  }, {});
};