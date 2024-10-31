// src/components/Media/TimelineSection.js
import { Box, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import SaveIcon from '@mui/icons-material/Save';

export const TimelineSection = ({ 
  selected, 
  onSaveClick, 
  onTimelineLoad, 
  onTimelineContextMenu,
  timelines = {} // New prop to receive timeline data
}) => (
  <>
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Button
        variant="outlined"
        startIcon={<SaveIcon />}
        fullWidth
        onClick={onSaveClick}
        sx={{ 
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': {
            borderColor: 'primary.dark',
            bgcolor: 'action.hover'
          }
        }}
      >
        Save Timeline
      </Button>
    </Box>

    <List sx={{ flexGrow: 1, overflow: 'auto' }}>
      {Object.entries(timelines).map(([name, timeline]) => (
        <ListItem
          key={name}
          selected={selected === name}
          onContextMenu={(e) => onTimelineContextMenu(e, name)}
          onClick={() => onTimelineLoad(name)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <TimelineIcon />
          </ListItemIcon>
          <ListItemText 
            primary={name}
            secondary={new Date(timeline.timestamp).toLocaleString()}
            primaryTypographyProps={{
              variant: 'body2',
              noWrap: true
            }}
            secondaryTypographyProps={{
              variant: 'caption'
            }}
          />
        </ListItem>
      ))}
    </List>
  </>
);