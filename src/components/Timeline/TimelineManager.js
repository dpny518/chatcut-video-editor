// src/components/Timeline/TimelineManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar } from '@mui/material';
import { Save, Delete, FolderOpen } from 'lucide-react';

const AUTOSAVE_DELAY = 3000;
const AUTOSAVE_NAME = 'Autosave';

const TimelineManager = ({ 
  clips = [], 
  selectedClipId,
  settings = {},
  effects = {},
  onTimelineLoad,
  availableMedia 
}) => {
  const [savedTimelines, setSavedTimelines] = useState({});
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [timelineName, setTimelineName] = useState('');
  const [showAutosaveNotification, setShowAutosaveNotification] = useState(false);

  // Create current timeline state
  const getCurrentTimelineState = useCallback(() => ({
    version: "2.0",
    timestamp: new Date().toISOString(),
    timeline: {
      format: {
        fps: 30,
        width: 1920,
        height: 1080
      },
      clips: clips.map(clip => ({
        id: clip.id,
        type: "video",
        source: {
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          file: {
            name: clip.file.name,
            size: clip.file.size,
            type: clip.file.type
          }
        },
        timeline: {
          startTime: clip.metadata?.timeline?.start || 0,
          endTime: clip.metadata?.timeline?.end || clip.duration,
          track: clip.metadata?.timeline?.track || 0
        },
        enabled: true,
        attributes: {
          selected: clip.id === selectedClipId,
          locked: false
        }
      })),
      duration: clips.reduce((max, clip) => {
        const endTime = (clip.metadata?.timeline?.end || clip.duration);
        return Math.max(max, endTime);
      }, 0),
      settings: {
        scale: settings.scale || 1,
        effects: effects
      }
    }
  }), [clips, selectedClipId, settings, effects]);

  // Load saved timelines from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedTimelines');
    if (saved) {
      setSavedTimelines(JSON.parse(saved));
    }
  }, []);

  // Autosave
  const autoSave = useCallback(() => {
    if (!clips.length) return;

    const timelineState = getCurrentTimelineState();
    const newTimelines = {
      ...savedTimelines,
      [AUTOSAVE_NAME]: {
        ...timelineState,
        lastModified: new Date().toISOString(),
        isAutosave: true
      }
    };

    setSavedTimelines(newTimelines);
    localStorage.setItem('savedTimelines', JSON.stringify(newTimelines));
    setShowAutosaveNotification(true);
  }, [clips, savedTimelines, getCurrentTimelineState]);

  // Setup autosave
  useEffect(() => {
    const timer = setTimeout(autoSave, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [clips, settings, effects, autoSave]);

  // Save timeline with name
  const handleSaveConfirm = () => {
    if (!timelineName) return;

    const timelineState = getCurrentTimelineState();
    const newTimelines = {
      ...savedTimelines,
      [timelineName]: {
        ...timelineState,
        lastModified: new Date().toISOString(),
        isAutosave: false
      }
    };

    setSavedTimelines(newTimelines);
    localStorage.setItem('savedTimelines', JSON.stringify(newTimelines));
    setSaveDialogOpen(false);
    setSelectedTimeline(timelineName);
  };

  // Load timeline
  const handleTimelineLoad = (name) => {
    const savedTimeline = savedTimelines[name];
    
    // Validate media files are available
    const missingFiles = savedTimeline.timeline.clips.filter(clip => 
      !availableMedia.find(media => media.name === clip.source.file.name)
    );

    if (missingFiles.length > 0) {
      alert(`Missing media files: ${missingFiles.map(f => f.source.file.name).join(', ')}`);
      return;
    }

    // Convert timeline data back to your app's format
    const loadedClips = savedTimeline.timeline.clips.map(clip => {
      const mediaFile = availableMedia.find(media => media.name === clip.source.file.name);
      
      return {
        id: clip.id,
        file: mediaFile,
        startTime: clip.source.startTime,
        endTime: clip.source.endTime,
        duration: clip.source.duration,
        metadata: {
          timeline: {
            start: clip.timeline.startTime,
            end: clip.timeline.endTime,
            track: clip.timeline.track
          }
        }
      };
    });

    onTimelineLoad({
      clips: loadedClips,
      settings: savedTimeline.timeline.settings,
      selectedClipId: savedTimeline.timeline.clips.find(c => c.attributes.selected)?.id
    });
    
    setSelectedTimeline(name);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <h3>Timelines</h3>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveClick}
          disabled={!currentTimelineState}
        >
          Save Timeline
        </Button>
      </Box>

      <List sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: 400
      }}>
        {Object.entries(savedTimelines).map(([name, timeline]) => (
          <ListItem
            key={name}
            selected={selectedTimeline === name}
            secondaryAction={
              <Box>
                <IconButton 
                  edge="end" 
                  onClick={() => handleTimelineLoad(name)}
                  title="Load Timeline"
                >
                  <FolderOpen />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleTimelineDelete(name)}
                  title="Delete Timeline"
                >
                  <Delete />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={name}
              secondary={`Last modified: ${new Date(timeline.lastModified).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Timeline</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Timeline Name"
            fullWidth
            value={timelineName}
            onChange={(e) => setTimelineName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfirm} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineManager;