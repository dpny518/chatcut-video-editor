// src/components/Transcript/FileCount.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const FileCount = ({ count }) => (
  <Box 
    sx={{ 
      py: 1.5,
      px: 2,
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      bgcolor: 'background.default',
    }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ 
        fontWeight: 500,
        fontSize: '0.75rem',
      }}
    >
      Files Selected: {count}
    </Typography>
  </Box>
);

export default FileCount;