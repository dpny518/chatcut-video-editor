import React, { useState, useCallback } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { promptTemplates } from './promptTemplates';
import { sendToLLM } from './Api';

const ChatBot = ({ 
  onSendMessage, 
  messages, 
  selectedBinClip, 
  transcriptData,
  onAddToTimeline // Add this prop
}) => {
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selection, setSelection] = useState(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer.parentNode;
    const endNode = range.endContainer.parentNode;

    if (startNode.hasAttribute('data-time') && endNode.hasAttribute('data-time')) {
      const start = parseFloat(startNode.getAttribute('data-time'));
      const end = parseFloat(endNode.getAttribute('data-time-end') || endNode.getAttribute('data-time'));
      
      setSelection({
        start,
        end,
        text: selection.toString()
      });
    }
  }, []);

  const handleAddToTimeline = useCallback(() => {
    if (!selection || !selectedBinClip) {
      console.warn('Missing required data for timeline clip', { selection, selectedBinClip });
      return;
    }
  
    // Create a video element to get duration
    const video = document.createElement('video');
    video.src = URL.createObjectURL(selectedBinClip.file);
  
    video.addEventListener('loadedmetadata', () => {
      const clipData = {
        id: `clip-${Date.now()}`,
        file: selectedBinClip.file,
        name: selectedBinClip.file.name,
        startTime: selection.start,
        endTime: selection.end,
        duration: selection.end - selection.start,
        source: {
          startTime: 0,
          endTime: video.duration,
          duration: video.duration
        },
        transcript: selection.text
      };
  
      // Cleanup
      video.src = '';
      URL.revokeObjectURL(video.src);
  
      console.log('Adding clip with data:', clipData);
      onAddToTimeline?.(clipData);
      setSelection(null);
    });
  
  }, [selection, selectedBinClip, onAddToTimeline]);

  // Parse the LLM response to create selectable text spans
  const createSelectableText = (text) => {
    // Assuming response format is "word|start|end|speaker" separated by spaces
    const words = text.split(' ');
    return words.map((word, index) => {
      const [text, start, end, speaker] = word.split('|');
      if (!start || !end) return text + ' ';
      
      return (
        <span
          key={index}
          data-time={start}
          data-time-end={end}
          data-speaker={speaker}
          style={{ cursor: 'pointer' }}
        >
          {text + ' '}
        </span>
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() && selectedTemplate) {
      setIsLoading(true);
      try {
        onSendMessage({
          text: input,
          sender: 'user',
          template: selectedTemplate
        });

        const templateContent = promptTemplates.find(t => t.name === selectedTemplate)?.template;
        if (!templateContent) {
          throw new Error('Template not found');
        }

        const wordTimingJson = transcriptData ? JSON.stringify(transcriptData) : '';
        
        const llmResponse = await sendToLLM(
          wordTimingJson,
          templateContent,
          input,
          'chat'
        );

        // Add LLM response to chat with selectable text
        onSendMessage({
          text: llmResponse,
          sender: 'bot',
          template: selectedTemplate,
          isSelectable: true // Add flag to identify selectable messages
        });

        setInput('');
      } catch (error) {
        console.error('Chat error:', error);
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
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor: '#1e1e1e'
        }}
        onMouseUp={handleTextSelection}
      >
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
            {msg.isSelectable ? createSelectableText(msg.text) : msg.text}
          </Box>
        ))}
      </Box>

      {/* Selection Actions */}
      {selection && (
        <Box sx={{ 
          p: 1, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          gap: 1 
        }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddToTimeline}
            fullWidth
          >
            Add Selection to Timeline
          </Button>
        </Box>
      )}

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