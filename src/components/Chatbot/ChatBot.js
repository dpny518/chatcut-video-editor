import React, { useState } from 'react';
import { 
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Paper,
  IconButton,
  Slide,
  Typography
} from '@mui/material';
import { 
  KeyboardArrowDown, 
  KeyboardArrowUp,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { promptTemplates } from './promptTemplates';
import { sendToLLM, sendToLlama } from './Api';

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
  const [isExpanded, setIsExpanded] = useState(true);
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
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: isExpanded ? 0 : 'auto',
          left: 0,
          width: '300px',
          height: isExpanded ? '400px' : '48px',
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          transition: 'height 0.3s ease',
          borderRadius: '8px 8px 0 0',
          cursor: !isExpanded ? 'pointer' : 'default' // Make entire header clickable when collapsed
        }}
        onClick={() => !isExpanded && setIsExpanded(true)} // Allow expanding when collapsed
      >
        {/* Header */}
        <Box sx={{ 
          p: 1.5,
          borderBottom: isExpanded ? 1 : 0,
          borderColor: 'divider',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '8px 8px 0 0'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Papercut Co-Pilot
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading && <CircularProgress size={20} color="inherit" />}
            <IconButton 
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'inherit' }}
            >
              {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            </IconButton>
          </Box>
        </Box>

        {isExpanded && (
          <>
            {/* Messages Area */}
            <Box 
              sx={{ 
                flex: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: theme.palette.background.default,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              {messages.map((msg, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '85%',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' 
                      ? theme.palette.primary.main
                      : msg.isError 
                        ? theme.palette.error.light
                        : msg.isSuccess 
                          ? theme.palette.success.light
                          : theme.palette.grey[100],
                    color: msg.sender === 'user' 
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary
                  }}
                >
                  <Typography variant="body2">
                    {msg.text}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Input Area */}
            <Box 
              component="form" 
              onSubmit={(e) => handleSubmit(e, true)}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
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
                multiline
                maxRows={3}
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  onClick={(e) => handleSubmit(e, true)}
                  variant="contained" 
                  disabled={!input.trim() || !selectedTemplate || isLoading}
                  fullWidth
                  size="small"
                >
                  GPT
                </Button>
                <Button 
                  onClick={(e) => handleSubmit(e, false)}
                  variant="outlined"
                  disabled={!input.trim() || !selectedTemplate || isLoading}
                  fullWidth
                  size="small"
                >
                  Llama
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Slide>
  );
};

export default ChatBot;
