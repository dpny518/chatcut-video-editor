import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

const TimelineList = ({ 
  timelines = [], 
  activeId = null, 
  onSelect = () => {} 
}) => {
  // Early return if no timelines
  if (!timelines.length) {
    return (
      <Box sx={{ p: 1, color: 'text.secondary' }}>
        <Typography variant="body2">No timelines created</Typography>
      </Box>
    );
  }

  return (
    <Tabs
      value={activeId || false}
      onChange={(e, newValue) => onSelect(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 40,
        '& .MuiTab-root': {
          minHeight: 40,
          py: 1,
          textTransform: 'none'
        }
      }}
    >
      {timelines.map((timeline) => (
        <Tab
          key={timeline.id}
          label={timeline.name}
          value={timeline.id}
          sx={{
            minWidth: 120,
            maxWidth: 200,
            fontSize: '0.875rem'
          }}
        />
      ))}
    </Tabs>
  );
};

export default TimelineList;