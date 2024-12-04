// src/components/Viewers/TranscriptViewer.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, Button, Typography, CircularProgress, Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useFileSystem } from '../../contexts/FileSystemContext';

const TranscriptViewer = ({ onAddToTimeline, timelineState }) => {
  const { selectedItems, getTranscriptData, files } = useFileSystem();
  const [displayContent, setDisplayContent] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const transcripts = useMemo(() => {
    // Filter out folder IDs from selectedItems
    const selectedFileIds = selectedItems.filter(id => files[id] && files[id].type !== 'folder');
    return getTranscriptData(selectedFileIds);
  }, [selectedItems, getTranscriptData, files]);

  useEffect(() => {
    setIsProcessing(true);
    console.log("Processing transcripts:", transcripts);

    if (!transcripts.length) {
      setDisplayContent([]);
      setIsProcessing(false);
      return;
    }

    const processTranscripts = () => {
      return transcripts.map(transcript => {
        const content = JSON.parse(transcript.content);
        const fileContent = content.processed_data || content;
        
        if (!fileContent.transcript || !fileContent.transcript.segments) {
          console.log("Transcript missing segments:", transcript);
          return null;
        }

        const fileSegments = fileContent.transcript.segments.map((segment, index) => ({
          ...segment,
          fileId: transcript.id,
          fileName: transcript.name,
          globalIndex: `${transcript.id}-${index}`,
          metadata: {
            ...segment.metadata,
            transcript: {
              fileId: transcript.id,
              fileName: transcript.name
            }
          }
        }));

        // Group continuous segments by the same speaker
        const groupedSegments = fileSegments.reduce((acc, segment) => {
          if (acc.length === 0 || acc[acc.length - 1][0].speaker !== segment.speaker) {
            acc.push([segment]);
          } else {
            acc[acc.length - 1].push(segment);
          }
          return acc;
        }, []);

        return {
          fileId: transcript.id,
          fileName: transcript.name,
          groupedSegments
        };
      }).filter(Boolean);
    };

    const processed = processTranscripts();
    setDisplayContent(processed);
    setIsProcessing(false);
  }, [transcripts]);

  const handleAddToTimeline = () => {
    const selectedContent = Array.from(selectedSegments)
      .map(globalIndex => {
        const [fileId, segmentIndex] = globalIndex.split('-');
        const transcriptFile = displayContent.find(t => t.fileId === fileId);
        const flatSegments = transcriptFile.groupedSegments.flat();
        return flatSegments[parseInt(segmentIndex)];
      })
      .sort((a, b) => {
        // First, sort by file order
        const fileOrderA = transcripts.findIndex(t => t.id === a.fileId);
        const fileOrderB = transcripts.findIndex(t => t.id === b.fileId);
        if (fileOrderA !== fileOrderB) return fileOrderA - fileOrderB;
        // If from the same file, sort by segment index
        return parseInt(a.globalIndex.split('-')[1]) - parseInt(b.globalIndex.split('-')[1]);
      });

    if (!selectedContent.length) return;

    const clipData = {
      id: `clip-${Date.now()}`,
      type: 'transcript',
      segments: selectedContent.map(segment => ({
        ...segment,
        metadata: {
          ...segment.metadata,
          timeline: {
            start: segment.start_time,
            end: segment.end_time,
            duration: segment.end_time - segment.start_time,
          }
        }
      })),
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

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
    }}>
      {selectedSegments.size > 0 && (
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
        }}>
          <Button
            variant="contained"
            onClick={handleAddToTimeline}
            startIcon={<AddIcon />}
            fullWidth
          >
            Add Selected to Timeline ({selectedSegments.size} segments)
          </Button>
        </Box>
      )}

      <Box sx={{ 
        flexGrow: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {isProcessing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : !displayContent.length ? (
            <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
              <Typography>No transcript data available</Typography>
            </Box>
          ) : (
            displayContent.map(file => (
              <Box key={file.fileId} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {file.fileName}
                </Typography>
                {file.groupedSegments.map((group, groupIndex) => (
                  <Box key={`${file.fileId}-group-${groupIndex}`} sx={{ mb: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'primary.main',
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      {group[0].speaker}
                    </Typography>
                    {group.map((segment) => {
                      const isSelected = selectedSegments.has(segment.globalIndex);
                      return (
                        <Box
                          key={segment.globalIndex}
                          onClick={() => {
                            setSelectedSegments(prev => {
                              const newSelection = new Set(prev);
                              if (newSelection.has(segment.globalIndex)) {
                                newSelection.delete(segment.globalIndex);
                              } else {
                                newSelection.add(segment.globalIndex);
                              }
                              return newSelection;
                            });
                          }}
                          sx={{
                            py: 0.25,
                            px: 1,
                            cursor: 'pointer',
                            borderRadius: 0.5,
                            bgcolor: isSelected ? 'action.selected' : 'transparent',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            },
                            transition: 'background-color 0.2s',
                            borderLeft: isSelected ? 2 : 0,
                            borderColor: 'primary.main',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'system-ui',
                              lineHeight: 1.4,
                            }}
                          >
                            {segment.words ? segment.words.map(word => word.word).join(' ') : segment.text}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default TranscriptViewer;