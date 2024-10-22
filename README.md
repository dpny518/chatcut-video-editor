```jsx
/*** VIDEO EDITOR PROJECT STATE ***/

/* App Purpose */
React-based video editor web app. Upload videos, select segments, arrange on timeline, manage gaps/transitions. Dark theme MUI interface.

/* Core Dependencies */
- @mui/material (UI)
- @xzdarcy/react-timeline-editor (Timeline)
- react-player (Video)

/* File Structure */
src/
├── components/
│   ├── BinViewer.js // Video preview + segment selection
│   │   props: { selectedClip: Clip, onAddToTimeline: (clip) => void }
│   │
│   ├── Controls/
│   │   └── ExportControls.js // Export + debug tools
│   │       props: { onExport, onDownloadState, onDebugClips }
│   │
│   ├── Layout/
│   │   ├── MainLayout.js // App wrapper
│   │   │   props: { mediaFiles[], selectedClip, onFileUpload, onFileSelect }
│   │   └── EditorLayout.js // Content layout
│   │
│   ├── MediaSidebar/
│   │   └── index.js // File management
│   │       props: { files[], onFileUpload, onFileSelect, selectedFile }
│   │
│   ├── Timeline/
│   │   ├── index.js // Main timeline
│   │   │   props: { clips[], onClipsChange, selectedClipId, onClipSelect }
│   │   ├── TimelineControls.js // Zoom/grid controls
│   │   ├── TimelineClip.js // Clip renderer
│   │   └── TimelineDebug.js // State visualization
│   │
│   └── Viewers/
       ├── BinViewerSection.js // Preview container
       └── TimelineViewerSection.js // Timeline preview

/* Data Types */
type Clip = {
  id: string,
  file: File,
  name: string,
  startTime: number,
  endTime: number,
  duration: number,
  type?: string,
  size?: number
}

type TimelineClip = Clip & {
  sourceStartTime: number,
  sourceEndTime: number
}

/* State Management (App.js) */
const [mediaFiles, setMediaFiles] = useState([])
const [selectedBinClip, setSelectedBinClip] = useState(null)
const [timelineClips, setTimelineClips] = useState([])

/* Core Features */
1. Media Management
   - File upload/select
   - Preview in BinViewer
   - Segment selection

2. Timeline Editing
   - Add clips sequentially
   - Support gaps between clips
   - Drag & drop reordering
   - Zoom controls
   - Grid snapping

3. Preview/Export
   - Live preview
   - Timeline playback
   - Export functionality (UI ready)

4. Debug Features
   - State download
   - Debug clips loading
   - State visualization

/* Next Development */
1. Audio track separation
2. Video export processing
3. Enhanced snapping
4. Transition effects

/* Working Example */
```javascript
// Adding clip to timeline
const handleAddToTimeline = (clip) => {
  const newClip = {
    id: `clip${timelineClips.length + 1}`,
    file: clip.file,
    name: clip.file.name,
    startTime: clip.startTime || 0,
    endTime: clip.endTime || 0,
    duration: (clip.endTime || 0) - (clip.startTime || 0)
  };
  setTimelineClips(prev => [...prev, newClip]);
};
```

/* Theme */
```javascript
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0ea5e9' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  }
});
```
```

[DEVELOPMENT STATUS: Core functionality working, component structure refactored, debug tools implemented. Need video export and audio handling.]

[COPY THIS TO NEW LLM TO CONTINUE DEVELOPMENT]