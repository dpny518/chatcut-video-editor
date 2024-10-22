// src/components/Timeline/styles/timelineStyles.js

// Base editor styles applied directly to the timeline component
export const timelineEditorStyles = {
    height: '100%',
    '--timeline-background-color': '#1a1a1a',
    '--timeline-row-height': '64px',
    '--timeline-row-padding': '4px',
    '--timeline-header-height': '32px',
    '--timeline-header-background': '#2a2a2a',
    '--timeline-grid-color': 'rgba(255,255,255,0.1)',
    paddingBottom: '20px', // Space for scrollbar
  };
  
  // Custom styles for different timeline elements
  export const customTimelineStyles = {
    // Style for each row in the timeline
    rowStyle: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.05)'
      },
      // Add subtle gradient for depth
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      transition: 'background-color 0.2s ease',
    },
  
    // Style for clip items (actions) in the timeline
    actionStyle: {
      margin: '2px 0',
      backgroundColor: '#2d3748',
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      '&:hover': {
        backgroundColor: '#3a4657',
        borderColor: 'rgba(255,255,255,0.2)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      },
      // Smooth transition for hover effects
      transition: 'all 0.2s ease',
    },
  
    // Style for the main timeline container
    containerStyle: {
      borderBottom: '3px solid rgba(255,255,255,0.15)',
      marginBottom: '20px', // Space for scrollbar
      paddingBottom: '2px',
      // Add subtle inner shadow at the bottom
      boxShadow: 'inset 0 -4px 6px -4px rgba(0,0,0,0.3)',
    },
  
    // Style for the timeline header
    headerStyle: {
      backgroundColor: '#2a2a2a',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      // Add subtle gradient
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
    },
  
    // Style for the time scale
    scaleStyle: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '12px',
      fontWeight: 500,
      // Add subtle text shadow
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
  
    // Style for selected items
    selectedStyle: {
      borderColor: '#4a90e2',
      boxShadow: '0 0 0 1px #4a90e2',
      '&:hover': {
        borderColor: '#5aa0f2',
        boxShadow: '0 0 0 1px #5aa0f2',
      },
    },
  
    // Style for the grid lines
    gridStyle: {
      borderColor: 'rgba(255,255,255,0.05)',
      // Add subtle gradient
      backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
    },
  
    // Style for drag preview
    dragPreviewStyle: {
      backgroundColor: 'rgba(74, 144, 226, 0.3)',
      border: '1px dashed #4a90e2',
      borderRadius: '4px',
    },
  
    // Style for timeline markers
    markerStyle: {
      backgroundColor: '#4a90e2',
      width: '2px',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-4px',
        width: '10px',
        height: '10px',
        backgroundColor: '#4a90e2',
        borderRadius: '50%',
        border: '2px solid #1a1a1a',
      },
    },
  
    // Style for the snap indicators
    snapIndicatorStyle: {
      backgroundColor: 'rgba(74, 144, 226, 0.5)',
      width: '1px',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-4px',
        left: '-2px',
        width: '5px',
        height: '5px',
        backgroundColor: '#4a90e2',
        borderRadius: '50%',
      },
    }
  };