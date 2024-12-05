import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ChatbotResponseViewer = ({ response }) => {
  const handleCopy = (e) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      e.clipboardData.setData('text/plain', selectedText);
      console.log('Copied text:', selectedText);
    }
  };

  return (
    <Box className="chatbot-response-viewer">
      <Typography variant="h6" gutterBottom>
        Chatbot Response
      </Typography>
      <Paper
        elevation={1}
        onCopy={handleCopy}
        sx={{
          minHeight: '100px',
          maxHeight: '300px',
          overflowY: 'auto',
          p: 2,
          whiteSpace: 'pre-wrap',
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Typography variant="body2" color="text.primary">
          {response}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatbotResponseViewer;