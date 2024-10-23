// src/components/Timeline/styles/scrollbarStyles.js
export const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '16px',
      height: '16px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.1)',
      '&:horizontal': {
        marginLeft: '16px',
        marginRight: '16px',
      }
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#4a90e2',
      borderRadius: '8px',
      border: '3px solid #1a1a1a',
      cursor: 'grab',
      '&:hover': {
        background: '#5aa0f2',
      },
      '&:active': {
        cursor: 'grabbing',
        background: '#3a80d2',
      }
    },
    '&::-webkit-scrollbar-button': {
      width: '16px',
      height: '16px',
      background: '#2a2a2a',
      border: '1px solid rgba(255,255,255,0.1)',
      '&:hover': {
        background: '#3a3a3a',
      },
      '&:active': {
        background: '#1a1a1a',
      },
      '&:horizontal:start': {
        borderRight: 'none',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 18 9 12 15 6'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      },
      '&:horizontal:end': {
        borderLeft: 'none',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }
    },
    '&::-webkit-scrollbar-corner': {
      background: '#1a1a1a',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
  };