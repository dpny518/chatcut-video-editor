import React from 'react';
import { 
  Stack, 
  Box, 
  Button, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  Download, 
  BugReport, 
  ZoomIn, 
  ZoomOut, 
  RestartAlt 
} from '@mui/icons-material';

const TimelineControls = ({
  onExport, 
  timelineState,
  selectedClipId,
  scale, 
  onZoomIn, 
  onZoomOut, 
  onZoomReset,
  onDebugClips
}) => {
  const handleDownloadState = () => {
    console.log("downloading file")
    console.log(timelineState.clip)
    try {
      const stateToExport = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        timeline: {
          clips: timelineState.clips.map(clip => {
            // Get the actual timeline action data for this clip
            const editorAction = timelineState.editorData?.actions?.find(
              action => action.id === clip.id
            );

            return {
              id: clip.id,
              source: {
                startTime: clip.startTime,
                endTime: clip.endTime,
                duration: clip.endTime - clip.startTime,
                name: clip.file.name
              },
              file: {
                name: clip.file.name,
                size: clip.file.size,
                type: clip.file.type
              },
              metadata: {
                originalDuration: clip.endTime - clip.startTime,
                timeline: {
                  sourceStart: clip.startTime,
                  sourceEnd: clip.endTime,
                  start: editorAction?.start || 0,
                  end: editorAction?.end || (clip.endTime - clip.startTime)
                }
              },
              position: {
                timelineStart: editorAction?.start || 0,
                timelineEnd: editorAction?.end || (clip.endTime - clip.startTime),
                row: editorAction?.data?.rowIndex || 0
              },
              state: {
                selected: clip.id === selectedClipId,
                effectId: editorAction?.effectId || 'default'
              }
            };
          }),
          duration: timelineState.duration || 0,
          settings: {
            scale: timelineState.scale || 1,
            effects: timelineState.effects || {
              default: {
                id: 'default',
                name: 'Default',
                style: {
                  backgroundColor: '#2d3748',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px'
                }
              },
              selected: {
                id: 'selected',
                name: 'Selected',
                style: {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                }
              }
            }
          }
        }
      };

      // Create and download the file
      const blob = new Blob([JSON.stringify(stateToExport, null, 2)], {
        type: 'application/json'
      });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `timeline_export_${timestamp}.json`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download state:', error);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button 
        variant="contained"
        onClick={onExport}
        sx={{
          bgcolor: '#0ea5e9',
          color: 'white',
          '&:hover': {
            bgcolor: '#0284c7'
          },
          textTransform: 'uppercase',
          fontWeight: 'medium',
          px: 3
        }}
      >
        Export Video
      </Button>

      <Box sx={{ display: 'flex', gap: 1, mx: 2 }}>
        <Tooltip title="Zoom In">
          <IconButton 
            onClick={onZoomIn}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton 
            onClick={onZoomOut}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset Zoom">
          <IconButton 
            onClick={onZoomReset}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <RestartAlt fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Current Scale: ${scale}`}>
          <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
            {scale}%
          </Box>
        </Tooltip>
      </Box>

      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
        <Tooltip title="Download Current State">
          <IconButton 
            onClick={handleDownloadState}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load Debug Clips">
          <IconButton 
            onClick={onDebugClips}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <BugReport fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
};

export default TimelineControls;