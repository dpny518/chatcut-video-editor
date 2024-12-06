// src/components/Papercut/ActivePapercut.js
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronDown } from 'lucide-react';

const ActivePapercut = ({ name, onMenuClick }) => (
  <Box 
    sx={{ 
      py: 1.5,
      px: 2,
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      bgcolor: 'background.default',
      justifyContent: 'space-between',
      height: '40px', // Match the height of FileCount
    }}
  >
    <Typography
      variant="body2"
      color="text.primary" // Change this to primary to make it black
      sx={{ 
        fontWeight: 500,
        fontSize: '0.75rem',
      }}
    >
      {name || 'No Papercuts'}
    </Typography>
    <IconButton 
      onClick={onMenuClick} 
      size="small"
      sx={{
        padding: 0,
        marginLeft: 1,
      }}
    >
      <ChevronDown size={16} />
    </IconButton>
  </Box>
);

export default ActivePapercut;