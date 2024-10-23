# Video Editor Web App

A React-based video editor for creating and editing video sequences with precise timing control and a professional-grade interface.

## 🚀 Features

### Media Management
- Upload and manage multiple video files
- Preview videos with frame-accurate controls
- Select specific segments for timeline placement

### Timeline Editing
- Intuitive drag-and-drop interface
- Frame-accurate trimming from both ends
- Dynamic thumbnail generation
- Detailed time information on hover
- Zoom controls for precise editing
- Grid snapping for accurate placement

### Advanced State Management
- Precise time tracking for clip modifications
- Original timing preservation when trimming
- Full modification history
- Undo capabilities
- State persistence

### UI/UX
- Dark theme optimized for video editing
- Real-time thumbnail generation
- Smooth playback controls
- Responsive layout
- Informative hover tooltips

## 🛠 Technical Stack

- **Frontend**: React.js
- **UI Components**: Material-UI (@mui/material)
- **Timeline**: @xzdarcy/react-timeline-editor
- **Video Playback**: react-player
- **State Management**: Immer + Custom hooks
- **Build Tools**: Vite

## 🏗 Architecture

The application follows a component-based architecture with custom hooks for state management:

### Core Components
- `BinViewer`: Media preview and segment selection
- `Timeline`: Main editing interface
- `TimelineClip`: Individual clip management
- `MediaSidebar`: File management

### State Management
- `useTimelineStateManager`: Central state management
- `TimelineClipState`: Individual clip state tracking
- `TimelineStateManager`: Global timeline state coordination

## 🔧 Development

### Prerequisites
```bash
node >= 14.0.0
npm >= 6.0.0
```

### Installation
```bash
npm install
npm run dev
```

### Project Structure
```
src/
├── components/      # UI Components
├── hooks/          # Custom hooks
├── utils/          # Helper functions
└── styles/         # Theme and styling
```

## 📚 Documentation

Detailed documentation available in:
- `docs/api.md`
- `docs/state-management.md`
- `docs/development.md`

