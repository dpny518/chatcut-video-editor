// src/components/Pages/HomePage.js
import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';

const HomePage = () => (
  <Box p={3}>
    <Typography variant="h4" gutterBottom>Media Dashboard</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Projects</Typography>
            <Typography>Project A - Last edited 2h ago</Typography>
            <Typography>Project B - Last edited 5h ago</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Stats</Typography>
            <Typography>Total Projects: 15</Typography>
            <Typography>Media Files: 45</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default HomePage;