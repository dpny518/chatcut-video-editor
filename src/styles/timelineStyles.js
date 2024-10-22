// src/components/Timeline/styles/timelineStyles.js
export const timelineEditorStyles = {
    height: '100%',
    '--timeline-background-color': '#1a1a1a',
    '--timeline-row-height': '64px',
    '--timeline-row-padding': '4px',
    '--timeline-header-height': '32px',
    '--timeline-header-background': '#2a2a2a',
    '--timeline-grid-color': 'rgba(255,255,255,0.1)',
    paddingBottom: '16px',
  };
  
  export const customTimelineStyles = {
    rowStyle: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.05)'
      }
    },
    actionStyle: {
      margin: '2px 0',
      backgroundColor: '#2d3748',
      borderRadius: '4px',
      overflow: 'hidden',
      '&:hover': {
        backgroundColor: '#3a4657'
      }
    },
    containerStyle: {
      borderBottom: '3px solid rgba(255,255,255,0.15)',
    }
  };