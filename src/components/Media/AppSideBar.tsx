'use client'

import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';

const AppSideBar = () => {
  return (
    <Box sx={{ width: 250, bgcolor: 'background.paper' }}>
      <List>
        <ListItem button>
          <ListItemText primary="Item 1" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Item 2" />
        </ListItem>
        {/* Add more items as needed */}
      </List>
    </Box>
  );
};

export default AppSideBar;