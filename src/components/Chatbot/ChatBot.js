import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { promptTemplates } from './promptTemplates';
import { sendToLLM } from './Api';

const ChatBot = ({ 
  onSendMessage, 
  messages, 
  selectedBinClip, 
  transcriptData,
  onAddToTimeline,
  timelineState,  // Make sure timelineState is being passed from App.js
  timelineRows = [{ rowId: 0, clips: [], lastEnd: 0 }],  // Add default value
  setTimelineRows 
}) => {
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const processAndAddToTimeline = async (text) => {
    try {
      if (!selectedBinClip) {
        throw new Error('No video clip selected');
      }
  
      // Parse words maintaining original order
      const words = text.split(' ')
        .filter(w => w.includes('|'))
        .map(word => {
          const [text, start, end, speaker] = word.split('|');
          if (!start || !end || isNaN(parseFloat(start)) || isNaN(parseFloat(end))) {
            throw new Error('Invalid word timing format');
          }
          return {
            text,
            start: parseFloat(start),
            end: parseFloat(end),
            speaker
          };
        });
  
      if (words.length === 0) {
        throw new Error('No valid words found in response');
      }
  
           // Group into segments by speaker
           let segments = [];
           let currentSegment = [words[0]];
           let currentSpeaker = words[0].speaker;
       
           for (let i = 1; i < words.length; i++) {
             const currentWord = words[i];
             
             if (currentWord.speaker !== currentSpeaker) {
               segments.push(currentSegment);
               currentSegment = [currentWord];
               currentSpeaker = currentWord.speaker;
             } else {
               currentSegment.push(currentWord);
             }
           }
           
           if (currentSegment.length > 0) {
             segments.push(currentSegment);
           }
       
           const video = document.createElement('video');
           video.src = URL.createObjectURL(selectedBinClip.file);
       
           video.addEventListener('loadedmetadata', () => {
             // Process each segment using timelineState
             segments.forEach((segment, index) => {
               const segmentStart = Math.min(...segment.map(w => w.start));
               const segmentEnd = Math.max(...segment.map(w => w.end));
               const timelineDuration = segmentEnd - segmentStart;
     
               // Calculate timeline placement using timelineState
               const timelineStart = timelineState.totalDuration;
               const timelineEnd = timelineStart + timelineDuration;
               
               const clipData = {
                 id: `clip-${Date.now()}-${index}`,
                 file: selectedBinClip.file,
                 name: selectedBinClip.file.name,
                 startTime: segmentStart,
                 endTime: segmentEnd,
                 duration: timelineDuration,
                 source: {
                   startTime: 0,
                   endTime: video.duration,
                   duration: video.duration
                 },
                 transcript: segment.map(word => word.text).join(' '),
                 metadata: {
                   timeline: {
                     start: timelineStart,
                     end: timelineEnd,
                     duration: timelineDuration,
                     track: 0
                   },
                   playback: {
                     start: segmentStart,
                     end: segmentEnd,
                     duration: timelineDuration
                   }
                 },
                 selectionInfo: {
                   words: segment,
                   timeRange: {
                     start: segmentStart,
                     end: segmentEnd
                   },
                   text: segment.map(word => word.text).join(' '),
                   speaker: segment[0].speaker
                 }
               };
     
               console.log(`Adding clip ${index + 1}:`, {
                 text: segment.map(w => w.text).join(' '),
                 timelineStart,
                 timelineEnd,
                 sourceStart: segmentStart,
                 sourceEnd: segmentEnd,
                 speaker: segment[0].speaker
               });
     
               onAddToTimeline?.(clipData);
             });
       
             video.src = '';
             URL.revokeObjectURL(video.src);
           });
       
           onSendMessage({
             text: `Successfully added ${segments.length} clip${segments.length > 1 ? 's' : ''} to timeline`,
             sender: 'bot',
             isSuccess: true
           });
       
         } catch (error) {
           console.error('Error processing segments:', error);
           onSendMessage({
             text: `Error: ${error.message}. Please try again with a different prompt.`,
             sender: 'bot',
             isError: true
           });
         }
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
        console.log(llmResponse)

        // Process response and add to timeline
        await processAndAddToTimeline(llmResponse);

        setInput('');
      } catch (error) {
        console.error('Chat error:', error);
        onSendMessage({
          text: `Error: ${error.message}. Please try a different prompt.`,
          sender: 'bot',
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
                backgroundColor: msg.isError ? '#ef4444' : 
                               msg.isSuccess ? '#22c55e' : '#2d2d2d',
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