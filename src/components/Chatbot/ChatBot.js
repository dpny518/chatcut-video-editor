import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { promptTemplates } from './promptTemplates';
import { sendToLLM, sendToLlama } from './Api';

const ChatBot = ({ 
  onSendMessage, 
  messages, 
  selectedClips = [],
  transcriptData = [], 
  onAddToTimeline,
  timelineState,
  timelineRows = [{ rowId: 0, clips: [], lastEnd: 0 }],
  setTimelineRows,
  onClipsChange
}) => {
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      console.log('=== Process Timeline Debug ===');
      console.log('Selected Clips:', selectedClips);
      console.log('Raw text response:', text);
      
      clearExistingClips();
      
      const words = text.split(' ')
        .filter(w => w.includes('|'))
        .map(word => {
          console.log('Processing word:', word);
          const [text, start, end, speaker, sourceFile] = word.split('|');
          console.log('Word parts:', { text, start, end, speaker, sourceFile });
          
          if (!start || !end || !sourceFile || 
              isNaN(parseFloat(start)) || isNaN(parseFloat(end))) {
            throw new Error('Invalid word timing format');
          }
          return {
            text,
            start: parseFloat(start),
            end: parseFloat(end),
            speaker,
            sourceFile
          };
        });

      if (words.length === 0) {
        throw new Error('No valid words found in response');
      }

      // Group into segments
      let segments = [];
      let currentSegment = [words[0]];
      let currentSpeaker = words[0].speaker;
      let currentSource = words[0].sourceFile;
      
      for (let i = 1; i < words.length; i++) {
        const currentWord = words[i];
        if (currentWord.speaker !== currentSpeaker || currentWord.sourceFile !== currentSource) {
          segments.push(currentSegment);
          currentSegment = [currentWord];
          currentSpeaker = currentWord.speaker;
          currentSource = currentWord.sourceFile;
        } else {
          currentSegment.push(currentWord);
        }
      }
      
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      let timelinePosition = 0;

      // Process each segment sequentially
      for (const segment of segments) {
        const sourceFile = segment[0].sourceFile;
        const sourceClip = selectedClips.find(clip => clip.file.name === sourceFile);
        
        if (!sourceClip) {
          console.warn(`Source clip not found for ${sourceFile}`);
          continue;
        }

        // Get video duration
        const duration = await new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.src = URL.createObjectURL(sourceClip.file);
          
          video.addEventListener('loadedmetadata', () => {
            const duration = video.duration;
            video.src = '';
            URL.revokeObjectURL(video.src);
            resolve(duration);
          });
          
          video.addEventListener('error', (error) => {
            video.src = '';
            URL.revokeObjectURL(video.src);
            reject(new Error(`Failed to load video metadata: ${error.message}`));
          });
        });

        const segmentStart = Math.min(...segment.map(w => w.start));
        const segmentEnd = Math.max(...segment.map(w => w.end));
        const timelineDuration = segmentEnd - segmentStart;
        
        const timelineStart = timelinePosition;
        const timelineEnd = timelineStart + timelineDuration;

        const clipData = {
          id: `clip-${Date.now()}-${segments.indexOf(segment)}`,
          file: sourceClip.file,
          name: sourceFile,
          startTime: segmentStart,
          endTime: segmentEnd,
          duration: timelineDuration,
          source: {
            startTime: 0,
            endTime: duration,
            duration: duration
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
            speaker: segment[0].speaker,
            sourceFile: sourceFile
          }
        };

        console.log(`Adding clip:`, {
          text: clipData.transcript,
          speaker: segment[0].speaker,
          sourceFile: sourceFile,
          sourceClip: sourceClip,
          sourceDuration: duration,
          timelineStart,
          timelineEnd,
          duration: timelineDuration
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
      }

      onSendMessage({
        text: `Successfully cleared timeline and added ${segments.length} new clip${segments.length > 1 ? 's' : ''}`,
        sender: 'bot',
        isSuccess: true
      });

    } catch (error) {
      console.error('Error processing timeline:', error);
      console.error('Stack:', error.stack);
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
        console.log('=== ChatBot Submit Debug ===');
        console.log('Selected Clips:', selectedClips);
        console.log('TranscriptData:', transcriptData);

        onSendMessage({
          text: input,
          sender: 'user',
          template: selectedTemplate
        });

        const templateContent = promptTemplates.find(t => t.name === selectedTemplate)?.template;
        if (!templateContent) {
          throw new Error('Template not found');
        }

        // Safety check for transcriptData
        if (!Array.isArray(transcriptData)) {
          throw new Error('No transcript data available');
        }

        // Prepare transcript data for API
        const wordTimingData = transcriptData.map(td => ({
          ...td.transcript,
          sourceFile: selectedClips.find(clip => clip.id === td.clipId)?.file.name
        }));
        
        console.log('Processed transcripts:', wordTimingData);
        const wordTimingJson = JSON.stringify(wordTimingData);
        
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
        
        console.log('LLM Response:', response);
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
        onSubmit={(e) => handleSubmit(e, true)}
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
