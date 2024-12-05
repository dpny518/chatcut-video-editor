import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { promptTemplates } from './promptTemplates';
import { sendToLLM, sendToLlama } from './Api';
import { useTheme } from '@mui/material/styles';

const ChatBot = ({ 
  onSendMessage, 
  messages, 
  selectedBinClip, 
  transcriptData,
  onAddToTimeline,
  timelineState,
  timelineRows = [{ rowId: 0, clips: [], lastEnd: 0 }],
  setTimelineRows,
  onClipsChange  // Add this prop to handle clearing clips
}) => {
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const clearExistingClips = () => {
    // Clear the timeline rows
    setTimelineRows(prev => {
      const updated = [...prev];
      updated[0] = { ...updated[0], clips: [], lastEnd: 0 };
      return updated;
    });

    // Clear the main clips array
    onClipsChange([]);
  };

  const processAndAddToTimeline = async (text) => {
    try {
      if (!selectedBinClip) {
        throw new Error('No video clip selected');
      }

      // Clear existing clips before adding new ones
      clearExistingClips();
      
      console.log('Timeline cleared, adding new clips...');

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
        // Start from position 0 since we cleared existing clips
        let timelinePosition = 0;
  
        // Process each segment
        segments.forEach((segment, index) => {
          const segmentStart = Math.min(...segment.map(w => w.start));
          const segmentEnd = Math.max(...segment.map(w => w.end));
          const timelineDuration = segmentEnd - segmentStart;
  
          const timelineStart = timelinePosition;
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
            text: clipData.transcript,
            speaker: segment[0].speaker,
            timelineStart,
            timelineEnd,
            duration: timelineDuration,
            sourceStart: segmentStart,
            sourceEnd: segmentEnd
          });
  
          setTimelineRows(prev => {
            const updated = [...prev];
            const targetRow = updated[0];
            targetRow.clips.push(clipData);
            targetRow.lastEnd = Math.max(targetRow.lastEnd, timelineEnd);
            return updated;
          });
  
          timelinePosition = timelineEnd + 0.0;
  
          onAddToTimeline?.(clipData);
        });
  
        video.src = '';
        URL.revokeObjectURL(video.src);
      });
  
      onSendMessage({
        text: `Successfully cleared timeline and added ${segments.length} new clip${segments.length > 1 ? 's' : ''}`,
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

  // Rest of the component remains the same...
  const handleSubmit = async (e, useGPT = true) => {
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
        
        let response;
        if (useGPT) {
          response = await sendToLLM(
            wordTimingJson,
            templateContent,
            input,
            'chat'
          );
        } else {
          response = await sendToLlama(
            wordTimingJson,
            templateContent,
            input,
            'chat'
          );
        }
        
        console.log(response);
        await processAndAddToTimeline(response);
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
      backgroundColor: theme.palette.background.paper,
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
          backgroundColor: theme.palette.background.default
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
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              } : {
                mr: 'auto',
                backgroundColor: msg.isError ? theme.palette.error.main : 
                               msg.isSuccess ? theme.palette.success.main : theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
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
        onSubmit={(e) => handleSubmit(e, true)}
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <FormControl size="small" fullWidth>
          <Select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            displayEmpty
            disabled={isLoading}
            sx={{
              backgroundColor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.action.hover,
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
        
        <TextField
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.paper,
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.action.hover,
              },
            },
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            onClick={(e) => handleSubmit(e, true)}
            variant="contained" 
            color="primary"
            disabled={!input.trim() || !selectedTemplate || isLoading}
            sx={{ flex: 1 }}
          >
            Send to GPT
          </Button>
          <Button 
            onClick={(e) => handleSubmit(e, false)}
            variant="contained" 
            color="secondary"
            disabled={!input.trim() || !selectedTemplate || isLoading}
            sx={{ flex: 1 }}
          >
            Send to Llama
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatBot;
