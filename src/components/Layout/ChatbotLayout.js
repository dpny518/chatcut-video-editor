import React from 'react';
import { Box, TextField, Button, useTheme } from '@mui/material';

const ChatbotLayout = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '240px',
      height: '300px',
      borderTop: 1,
      borderRight: 1,
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      borderRadius: '8px',
      overflow: 'hidden',
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
        overflowY: 'auto',
        p: 2,
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Chat messages would go here */}
        <Box sx={{
          alignSelf: 'flex-start',
          maxWidth: '70%',
          mb: 1.5,
          p: '8px 12px',
          borderRadius: '18px',
          fontSize: '14px',
          lineHeight: 1.4,
          backgroundColor: 'grey.200',
          color: 'text.primary',
        }}>
          Bot message
        </Box>
        <Box sx={{
          alignSelf: 'flex-end',
          maxWidth: '70%',
          mb: 1.5,
          p: '8px 12px',
          borderRadius: '18px',
          fontSize: '14px',
          lineHeight: 1.4,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}>
          User message
        </Box>
      </Box>

      <Box sx={{
        p: 2,
        display: 'flex',
        gap: 1,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}>
        <TextField
          size="small"
          placeholder="Type your message..."
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              borderRadius: '20px',
              '& fieldset': {
                borderColor: 'grey.300',
              },
              '&:hover fieldset': {
                borderColor: 'grey.400',
              },
            },
          }}
        />
        <Button 
          variant="contained" 
          color="primary"
          sx={{ 
            minWidth: '60px',
            borderRadius: '20px',
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatbotLayout;