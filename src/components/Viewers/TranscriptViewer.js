// src/components/Viewers/TranscriptViewer.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box,
  Card,
  IconButton,
  Tooltip,
  Button,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  FormatStrikethrough as StrikethroughIcon,
  HighlightAlt as HighlightIcon,
  Search as SearchIcon,
  ArrowUpward as InsertIcon,
} from '@mui/icons-material';
import { useFileSystem } from '../../contexts/FileSystemContext';

const ToolbarButton = ({ title, icon, onClick, disabled = false }) => (
  <Tooltip title={title}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

const TranscriptToolbar = ({ onAction }) => (
  <Box
    sx={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      bgcolor: 'background.paper',
      borderTop: 1,
      borderColor: 'divider',
      p: 0.5,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      height: '48px',
      zIndex: 1,
    }}
  >
    <ToolbarButton
      title="Insert Above"
      icon={<InsertIcon fontSize="small" />}
      onClick={() => onAction('insert')}
    />
    <ToolbarButton
      title="Add Below"
      icon={<AddIcon fontSize="small" />}
      onClick={() => onAction('add')}
    />
    <Divider orientation="vertical" flexItem />
    <ToolbarButton
      title="Strikethrough"
      icon={<StrikethroughIcon fontSize="small" />}
      onClick={() => onAction('strikethrough')}
    />
    <ToolbarButton
      title="Highlight"
      icon={<HighlightIcon fontSize="small" />}
      onClick={() => onAction('highlight')}
    />
    <Divider orientation="vertical" flexItem />
    <ToolbarButton
      title="Find/Match"
      icon={<SearchIcon fontSize="small" />}
      onClick={() => onAction('find')}
    />
  </Box>
);

const TranscriptViewer = ({ onAddToTimeline, timelineState }) => {
  const { selectedItems, getTranscriptData } = useFileSystem();
  const [displayContent, setDisplayContent] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const transcripts = useMemo(() => getTranscriptData(selectedItems), [selectedItems, getTranscriptData]);

  console.log("TranscriptViewer received transcripts:", transcripts);

  const processedTranscripts = useMemo(() => {
    console.log("Processing transcripts:", transcripts);
    if (!transcripts || !transcripts.length) {
      console.log("No transcripts to process");
      return [];
    }

    return transcripts.map(transcript => {
      try {
        const content = JSON.parse(transcript.content);
        const fileContent = content.processed_data || content;
        
        if (!fileContent.transcript || !fileContent.transcript.segments) {
          console.log("Transcript missing segments:", transcript);
          return null;
        }

        return {
          fileId: transcript.id,
          fileName: transcript.name,
          segments: fileContent.transcript.segments.map((segment, index) => ({
            ...segment,
            globalIndex: `${transcript.id}-${index}`,
          })),
        };
      } catch (error) {
        console.error(`Error parsing transcript ${transcript.name}:`, error);
        return null;
      }
    }).filter(Boolean);
  }, [transcripts]);

  useEffect(() => {
    console.log("Setting display content:", processedTranscripts);
    setIsProcessing(true);
    setDisplayContent(processedTranscripts);
    setIsProcessing(false);
  }, [processedTranscripts]);

  const handleSegmentClick = (globalIndex) => {
    setSelectedSegments(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(globalIndex)) {
        newSelection.delete(globalIndex);
      } else {
        newSelection.add(globalIndex);
      }
      return newSelection;
    });
  };

  const handleAddToTimeline = () => {
    const selectedContent = Array.from(selectedSegments).map(globalIndex => {
      const [fileId, segmentIndex] = globalIndex.split('-');
      const transcriptFile = displayContent.find(t => t.fileId === fileId);
      return transcriptFile.segments[parseInt(segmentIndex)];
    }).sort((a, b) => a.start_time - b.start_time);

    if (!selectedContent.length) return;

    const clipData = {
      id: `clip-${Date.now()}`,
      type: 'transcript',
      segments: selectedContent,
      metadata: {
        timeline: {
          start: timelineState.totalDuration,
          end: timelineState.totalDuration + selectedContent.reduce((total, segment) => 
            total + (segment.end_time - segment.start_time), 0),
          row: 0
        }
      }
    };

    console.log('Adding to timeline:', clipData);
    onAddToTimeline(clipData);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          onClick={handleAddToTimeline}
          disabled={!selectedSegments.size}
        >
          Add Selected to Timeline ({selectedSegments.size} segments)
        </Button>
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
      }}>
        {isProcessing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !displayContent.length ? (
          <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
            <Typography>No transcript data available</Typography>
            <Typography variant="caption">Raw data:</Typography>
            <pre>{JSON.stringify(transcripts, null, 2)}</pre>
          </Box>
        ) : (
          displayContent.map((transcriptFile) => (
            <Box key={transcriptFile.fileId} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                {transcriptFile.fileName}
              </Typography>
              
              {transcriptFile.segments.map((segment) => {
                const isSelected = selectedSegments.has(segment.globalIndex);
                return (
                  <Box
                    key={segment.globalIndex}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      borderRadius: 1,
                      mb: 1,
                      border: isSelected ? 1 : 0,
                      borderColor: 'primary.main'
                    }}
                    onClick={() => handleSegmentClick(segment.globalIndex)}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      [{formatTime(segment.start_time)} - {formatTime(segment.end_time)}]
                    </Typography>
                    <Typography>
                      <strong>{segment.speaker}:</strong> {segment.words ? segment.words.map(w => w.word).join(' ') : segment.text}
                    </Typography>
                  </Box>
                );
              })}
              
              <Divider sx={{ my: 2 }} />
            </Box>
          ))
        )}
      </Box>

      <TranscriptToolbar 
        onAction={(action) => {
          console.log('Toolbar action:', action);
          // Handle toolbar actions here
        }}
      />
    </Card>
  );
};

export default TranscriptViewer;