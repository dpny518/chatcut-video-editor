# State Management Documentation

## Overview

The application uses a hybrid state management approach combining React's built-in state management with custom state managers for complex timeline operations.

## Core State Managers

### TimelineStateManager

The central state management class for timeline operations.

```typescript
class TimelineStateManager {
  clips: Map<string, TimelineClipState>;
  history: ModificationHistory[];
  currentOperation: Operation | null;
}
```

#### Key Features
- Immutable state updates using Immer
- Modification history tracking
- Undo capability
- State persistence

#### State Flow
1. Clip Creation → State Initialization
2. Modification Start → State Transition
3. State Update → Immutable Change
4. Modification Complete → History Update

### TimelineClipState

Manages individual clip state and modifications.

```typescript
class TimelineClipState {
  // Timing Properties
  sourceStartTime: number;
  sourceEndTime: number;
  timelineStartTime: number;
  timelineEndTime: number;
  
  // State Properties
  state: CLIP_STATES;
  modifications: Modification[];
}
```

#### State Transitions
```
INITIAL → MOVING/TRIMMING → COMPLETED
```

## State Updates

### Clip Movement
```javascript
moveClip(clipId, newPosition) {
  // Calculate new position
  // Update timeline times
  // Preserve source timing
  // Record modification
}
```

### Clip Trimming
```javascript
trimClip(clipId, newStart, newEnd) {
  // Calculate new duration
  // Update timeline position
  // Scale source timing
  // Record modification
}
```

## Time Handling

### Time Preservation
- Original source times are preserved
- Timeline positions are tracked separately
- Modifications maintain time relationships

### Time Scaling
```javascript
const timeScale = originalDuration / newDuration;
const sourceOffset = (newStart - timelineStart) * timeScale;
```

## Modification History

### Structure
```typescript
interface Modification {
  type: ModificationType;
  timestamp: number;
  before: TimingState;
  current: TimingState;
  completed?: number;
}
```

### History Management
- Limited history size
- Automatic cleanup
- Undo support

## State Persistence

### Local Storage
- Clip states are serializable
- File references maintained
- History preserved

### Cache Management
- Thumbnail caching
- State cleanup on unmount
- Memory optimization