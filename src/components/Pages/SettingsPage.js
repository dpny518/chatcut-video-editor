// src/components/Pages/SettingsPage.js
import React from 'react';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const SettingsPage = ({ themeMode, onThemeChange }) => (
  <Box p={3}>
    <Typography variant="h5" gutterBottom>Settings</Typography>
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>Theme Mode</Typography>
        <IconButton onClick={onThemeChange} color="inherit">
          {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </CardContent>
    </Card>
  </Box>
);

export default SettingsPage;