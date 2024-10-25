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
    console.log("downloading file");
    
    try {
      const stateToExport = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        timeline: {
          clips: timelineState.clips.map(clip => {
            // Get the stored metadata that was updated by TimelineClip
            const metadata = clip.metadata || {};
            const playback = metadata.playback || {};
            const timeline = metadata.timeline || {};

            return {
              id: clip.id,
              source: {
                startTime: playback.start,  // Use stored playback times
                endTime: playback.end,
                duration: clip.source?.duration,
                name: clip.file.name
              },
              file: {
                name: clip.file.name,
                size: clip.file.size,
                type: clip.file.type
              },
              metadata: {
                originalDuration: clip.source?.duration,
                timeline: {
                  sourceStart: clip.source?.startTime,
                  sourceEnd: clip.source?.endTime,
                  start: timeline.start,
                  end: timeline.end,
                  duration: timeline.duration
                },
                playback: {
                  start: playback.start,
                  end: playback.end,
                  duration: playback.duration
                }
              },
              position: {
                timelineStart: timeline.start,
                timelineEnd: timeline.end,
                currentStart: playback.start,
                currentEnd: playback.end,
                track: timeline.track || 0
              },
              state: {
                selected: clip.id === selectedClipId,
                effectId: clip.effectId || 'default'
              }
            };
          }),
          duration: timelineState.duration || 0,
          settings: {
            scale: scale || 1,
            effects: timelineState.settings?.effects || {}
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

      console.log('Exported timeline state:', stateToExport);

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