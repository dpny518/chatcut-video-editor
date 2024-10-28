import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { promptTemplates } from './promptTemplates';
import { sendToLLM } from './Api';

const ChatBot = ({ onSendMessage, messages, selectedBinClip, transcriptData }) => {
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() && selectedTemplate) {
      setIsLoading(true);
      try {
        // First, add the user's message to the chat
        onSendMessage({
          text: input,
          sender: 'user',
          template: selectedTemplate
        });

        // Prepare the word timing JSON from transcript data
        const wordTimingJson = transcriptData ? JSON.stringify(transcriptData) : '';

        // Send to LLM and get response
        const llmResponse = await sendToLLM(
          wordTimingJson,
          selectedTemplate,
          input,
          'chat' // or any specific task identifier you want to use
        );

        // Add the LLM's response to the chat
        onSendMessage({
          text: llmResponse,
          sender: 'bot',
          template: selectedTemplate
        });

        // Clear the input
        setInput('');
      } catch (error) {
        // Add error message to chat
        onSendMessage({
          text: `Error: ${error.message}`,
          sender: 'bot',
          template: selectedTemplate,
          isError: true
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

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
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>
          Chatbot
        </Box>
        {isLoading && <CircularProgress size={20} />}
      </Box>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 1,
        backgroundColor: '#1e1e1e'
      }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              p: 1,
              mb: 1,
              borderRadius: 1,
              maxWidth: '85%',
              wordBreak: 'break-word',
              ...(msg.sender === 'user' ? {
                ml: 'auto',
                backgroundColor: '#0ea5e9',
                color: 'white',
              } : {
                mr: 'auto',
                backgroundColor: msg.isError ? '#ef4444' : '#2d2d2d',
                color: 'white',
              })
            }}
          >
            {msg.text}
          </Box>
        ))}
      </Box>

      {/* Input Area */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <FormControl size="small" fullWidth>
          <Select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            displayEmpty
            disabled={isLoading}
            sx={{
              backgroundColor: '#2d2d2d',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#404040',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#505050',
              },
            }}
          >
            <MenuItem value="">Select a template</MenuItem>
            {promptTemplates.map(template => (
              <MenuItem key={template.name} value={template.name}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
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
            type="submit"
            variant="contained" 
            color="primary"
            disabled={!input.trim() || !selectedTemplate || isLoading}
            sx={{ minWidth: '60px' }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatBot;