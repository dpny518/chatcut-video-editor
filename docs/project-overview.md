# Web Video Editor Project Overview

## Core Flow

1. **Media Upload & Management**
   - Entry: MediaSidebar.js
   - Flow: User uploads video files → Files stored in state → Displayed in MediaBin
   - Key Components:
     - `MediaSidebar`: Handles file upload UI and timeline project management
     - `MediaBin`: Displays uploaded media files
     - State: `mediaFiles` in App.js

2. **Clip Selection & Preview**
   - Entry: BinViewer.js
   - Flow: User selects media → Preview in BinViewer → Can trim/select region
   - Key Components:
     - `BinViewer`: Video preview and trim controls
     - `BinViewerSection`: Container for viewer and controls
     - State: `selectedBinClip` in App.js

3. **Timeline Management**
   - Entry: Timeline/index.js
   - Flow: Add clips → Arrange on timeline → Modify positions/durations
   - Key Components:
     - `Timeline`: Main timeline editor component
     - `TimelineClip`: Individual clip representation
     - `TimelineControls`: Zoom and timeline controls
     - State: `timelineClips` in App.js

4. **State Management**
   - Entry: useTimelineStateManager.js
   - Flow: Manages timeline state → Handles modifications → Saves/loads projects
   - Key Functions:
     - `saveTimelineProject`: Saves current timeline state
     - `loadTimelineProject`: Loads saved timeline
     - `processTimelineClips`: Processes clips for loading
     - State: Local storage for persistence

## Detailed Component Breakdown

### Media Management
```typescript
// MediaSidebar.js
interface MediaSidebarProps {
  files: File[];
  onFileUpload: (file: File) => void;
  onFileSelect: (file: File) => void;
  timelineProjects: {
    selected: string | null;
    onSave: (name: string) => void;
    onLoad: (name: string) => void;
    onDelete: (name: string) => void;
  };
}
```

### Timeline Editing
```typescript
// Timeline/index.js
interface TimelineProps {
  clips: TimelineClip[];
  onClipsChange: (clips: TimelineClip[]) => void;
  selectedClipId: string;
  onClipSelect: (id: string) => void;
}
```

### State Management
```typescript
// useTimelineStateManager.js
interface TimelineState {
  clips: TimelineClip[];
  metadata: {
    scale: number;
    selectedClipId: string | null;
  };
  settings: {
    effects: Record<string, Effect>;
  };
}
```

## Data Flow Diagram

```
Upload → MediaBin
   ↓
Select → BinViewer
   ↓
Add to Timeline → TimelineClip
   ↓
Edit/Arrange → Timeline
   ↓
Save/Export → TimelineStateManager
```

## Key Features & Implementation

1. **Video Upload**
   - Component: `MediaSidebar`
   - Handler: `handleFileUpload`
   - Storage: In-memory state + file references

2. **Clip Selection**
   - Component: `BinViewer`
   - Handler: `handleFileSelect`
   - State: `selectedBinClip`

3. **Timeline Operations**
   - Move: `handleMoveStart`, `handleMoving`, `handleMoveEnd`
   - Resize: `handleResizeStart`, `handleResizing`, `handleResizeEnd`
   - Delete: Context menu + keyboard delete

4. **Project Management**
   - Save: `saveTimelineProject` (localStorage)
   - Load: `loadTimelineProject` (with media validation)
   - Export: `exportTimelineData` (JSON download)

## State Structure

```javascript
{
  timeline: {
    clips: [{
      id: string;
      source: {
        startTime: number;
        endTime: number;
        duration: number;
      };
      metadata: {
        timeline: {
          start: number;
          end: number;
          track: number;
        };
        playback: {
          start: number;
          end: number;
        };
      };
    }];
    settings: {
      scale: number;
      effects: Object;
    };
  }
}
```

## Important Considerations

1. **Time Management**
   - Source time vs Timeline time
   - Maintaining original durations
   - Handling trimmed sections

2. **State Persistence**
   - Project saving/loading
   - Media file references
   - Timeline positions

3. **Performance**
   - Thumbnail generation
   - Cache management
   - Render optimization

4. **Error Handling**
   - Missing media files
   - Invalid timeline states
   - Load/save failures

## Development Guidelines

1. Use TypeScript for new components
2. Follow existing patterns for state updates
3. Maintain immutable state updates
4. Document complex operations
5. Add error boundaries for stability

## Performance Considerations

### Video Playback
- Preload next clip
- Unload distant clips
- Use requestAnimationFrame
- Hardware acceleration

### Timeline Rendering
- Virtualize clip rendering
- Optimize thumbnail generation
- Cache calculated positions

### State Management
- Immutable updates
- Selective rerenders
- Batch timeline updates

## Error Handling

### Media Errors
- Missing files
- Corrupt video
- Unsupported format

### Timeline Errors
- Invalid positions
- Overlapping clips
- Save/load failures

## Testing Strategy

### Unit Tests
- Timeline calculations
- State transitions
- File handling

### Integration Tests
- Clip operations
- Timeline playback
- Save/load cycle

### Performance Tests
- Large timeline handling
- Multiple video playback
- Memory management

with 
# Web Video Editor Project Overview