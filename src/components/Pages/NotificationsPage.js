// src/components/Pages/NotificationsPage.js
import { Box, List, ListItem, ListItemText, ListItemIcon, Typography } from '@mui/material';
import { Info, Warning } from '@mui/icons-material';

const NotificationsPage = () => (
  <Box p={3}>
    <Typography variant="h5" gutterBottom>Notifications</Typography>
    <List>
      <ListItem>
        <ListItemIcon><Info color="primary" /></ListItemIcon>
        <ListItemText 
          primary="New comment on Project A"
          secondary="2 minutes ago"
        />
      </ListItem>
      <ListItem>
        <ListItemIcon><Warning color="warning" /></ListItemIcon>
        <ListItemText 
          primary="Storage space running low"
          secondary="1 hour ago"
        />
      </ListItem>
    </List>
  </Box>
);

export default NotificationsPage;