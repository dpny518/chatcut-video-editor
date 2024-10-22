// src/components/Layout/EditorLayout.js
import React from 'react';
import { Box } from '@mui/material';
const EditorLayout = ({ children }) => {
  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'background.default'
    }}>
      {children}
    </Box>
  );
};
export default  EditorLayout;