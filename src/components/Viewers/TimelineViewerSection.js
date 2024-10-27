import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton, Alert } from '@mui/material';
import { FileVideo, FileText } from 'lucide-react';
import TimelineViewer from './TimelineViewer';
import TimelineTranscriptViewer from './TimelineTranscriptViewer';
import useTimelineStore from '../../stores/timelineStore';
import useTranscriptStore from '../../stores/transcriptStore';

const TimelineViewerSection = React.memo(() => {
  const [viewMode, setViewMode] = useState('video');

  // Split store selectors to prevent unnecessary re-renders
  const clips = useTimelineStore(state => state.clips);
  const selectedClipId = useTimelineStore(state => state.selectedClipId);
  const playbackTime = useTimelineStore(state => state.playbackTime);

  const timelineTranscripts = useTranscriptStore(state => state.timelineTranscripts);
  const processClipTranscript = useTranscriptStore(state => state.processClipTranscript);
  const clearTimelineTranscripts = useTranscriptStore(state => state.clearTimelineTranscripts);

  // Process transcripts when clips change
  useEffect(() => {
    const unprocessedClips = clips.filter(clip => !timelineTranscripts.has(clip.id));
    
    if (unprocessedClips.length === 0) return;
    
    clearTimelineTranscripts();
    unprocessedClips.forEach(processClipTranscript);
  }, [clips, processClipTranscript, clearTimelineTranscripts]); // Remove timelineTranscripts from deps

  const handleViewModeChange = useCallback((event, newMode) => {
    if (newMode) {
      setViewMode(newMode);
    }
  }, []);

  const currentClip = useMemo(() => 
    clips.find(clip => clip.id === selectedClipId),
    [clips, selectedClipId]
  );

  if (!clips.length) {
    return (
      <Paper sx={{ 
        flex: 1, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Alert 
          severity="info"
          sx={{ width: '100%', maxWidth: 400 }}
        >
          Add media files and create clips to start building your timeline
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.default'
      }}>
        <Box sx={{ 
          typography: 'subtitle1',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Timeline Viewer
          {currentClip && (
            <Box component="span" sx={{ 
              typography: 'caption',
              color: 'text.secondary'
            }}>
              • {currentClip.name}
            </Box>
          )}
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="video" aria-label="video view">
            <FileVideo className="w-4 h-4 mr-2" />
            Video
          </ToggleButton>
          <ToggleButton 
            value="transcript"
            aria-label="transcript view"
            disabled={!timelineTranscripts.size}
          >
            <FileText className="w-4 h-4 mr-2" />
            Transcript
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
      }}>
        {viewMode === 'video' ? (
          <TimelineViewer />
        ) : (
          <TimelineTranscriptViewer
            clips={clips}
            transcripts={timelineTranscripts}
            currentTime={playbackTime}
          />
        )}
      </Box>
    </Paper>
  );
});

TimelineViewerSection.displayName = 'TimelineViewerSection';

export default TimelineViewerSection;