// src/components/Pages/ProfilePage.js
import { Box, Card, CardContent, Avatar, Button, Grid, Typography, TextField } from '@mui/material';

const ProfilePage = () => (
  <Box p={3}>
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Avatar sx={{ width: 120, height: 120, mb: 2 }}>U</Avatar>
            <Typography variant="h5">User Name</Typography>
            <Typography color="textSecondary">Editor</Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>Account Details</Typography>
            <TextField
              fullWidth
              label="Email"
              defaultValue="user@example.com"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Name"
              defaultValue="User Name"
              margin="normal"
            />
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Changes
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </Box>
);

export default ProfilePage;