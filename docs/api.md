# API Documentation

## Components API

### BinViewer
```typescript
interface BinViewerProps {
  selectedClip: Clip;
  onAddToTimeline: (clip: Clip) => void;
}

// State
interface BinViewerState {
  playing: boolean;
  duration: number;
  currentTime: number;
  range: [number, number];
  loading: boolean;
  error: Error | null;
  videoUrl: string | null;
}
```

### Timeline
```typescript
interface TimelineProps {
  clips: TimelineClip[];
  onClipsChange: (clips: TimelineClip[]) => void;
  selectedClipId: string | null;
  onClipSelect: (clipId: string) => void;
}
```

### TimelineClip
```typescript
interface TimelineClipProps {
  clip: Clip;
  action: TimelineAction;
  isSelected: boolean;
  onSelect: (clipId: string) => void;
}

interface TimelineAction {
  id: string;
  start: number;
  end: number;
  effectId: string;
  data: any;
}
```

## Hooks API

### useTimelineStateManager
```typescript
interface TimelineStateManager {
  updateClip: (clip: Clip) => void;
  startClipModification: (clipId: string, type: ModificationType) => void;
  moveClip: (clipId: string, newPosition: number) => void;
  trimClip: (clipId: string, newStart: number, newEnd: number) => void;
  completeModification: (clipId: string) => void;
  undoClipModification: (clipId: string) => void;
  getAllClipsState: () => ClipState[];
}

enum ModificationType {
  MOVING = 'MOVING',
  TRIMMING = 'TRIMMING'
}
```

### useTimelineZoom
```typescript
interface ZoomHook {
  scale: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}
```

## Data Types

### Clip
```typescript
interface Clip {
  id: string;
  file: File;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type?: string;
  size?: number;
}
```

### TimelineClip
```typescript
interface TimelineClip extends Clip {
  sourceStartTime: number;
  sourceEndTime: number;
  timelineStartTime: number;
  timelineEndTime: number;
  currentStartTime: number;
  currentEndTime: number;
}
```

## Events

### Timeline Events
```typescript
interface TimelineEvents {
  onClipSelect: (clipId: string) => void;
  onClipMove: (clipId: string, newPosition: number) => void;
  onClipTrim: (clipId: string, newStart: number, newEnd: number) => void;
  onClipDelete: (clipId: string) => void;
}
```

### BinViewer Events
```typescript
interface BinViewerEvents {
  onRangeChange: (start: number, end: number) => void;
  onAddToTimeline: (clip: Clip) => void;
  onPlaybackChange: (playing: boolean) => void;
}
```