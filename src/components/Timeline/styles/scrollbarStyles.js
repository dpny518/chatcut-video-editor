export const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '16px',
      height: '20px', // Increased height for horizontal scrollbar
    },
    '&::-webkit-scrollbar-track': {
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#4a90e2',
      borderRadius: '8px',
      border: '3px solid #1a1a1a',
      cursor: 'grab',
      '&:hover': {
        background: '#5aa0f2',
        boxShadow: '0 0 2px 1px rgba(0, 0, 0, 0.2)',
      },
      '&:active': {
        cursor: 'grabbing',
        background: '#3a80d2',
      }
    },
    '&::-webkit-scrollbar-button': {
      width: '20px', // Increased width
      height: '20px', // Increased height
      background: '#2a2a2a',
      border: '1px solid rgba(255,255,255,0.2)',
      '&:hover': {
        background: '#3a3a3a',
        border: '1px solid rgba(255,255,255,0.3)',
      },
      '&:active': {
        background: '#1a1a1a',
      },
      '&:horizontal:start': {
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.8)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='15 18 9 12 15 6'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.1)',
      },
      '&:horizontal:end': {
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.8)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        boxShadow: 'inset -1px 1px 0 rgba(255,255,255,0.1)',
      }
    },
    '&::-webkit-scrollbar-corner': {
      background: '#1a1a1a',
    },
  };