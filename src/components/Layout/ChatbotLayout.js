import React from 'react';
import { Box, TextField, Button } from '@mui/material';

const ChatbotLayout = () => {
  return (
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '240px', // Match sidebar width
      height: '300px',
      borderTop: 1,
      borderRight: 1,
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.default'
      }}>
        <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>
          Chatbot
        </Box>
      </Box>

      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 1,
        backgroundColor: '#1e1e1e'
      }}>
        {/* Chat messages would go here */}
      </Box>

      <Box sx={{
        p: 1,
        display: 'flex',
        gap: 1,
        borderTop: 1,
        borderColor: 'divider',
      }}>
        <TextField
          size="small"
          placeholder="Type your message..."
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#2d2d2d',
              '& fieldset': {
                borderColor: '#404040',
              },
              '&:hover fieldset': {
                borderColor: '#505050',
              },
            },
          }}
        />
        <Button 
          variant="contained" 
          color="primary"
          sx={{ minWidth: '60px' }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatbotLayout;