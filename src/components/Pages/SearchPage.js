// src/components/Pages/SearchPage.js
import { Box, TextField, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';

const SearchPage = () => (
  <Box p={3}>
    <TextField 
      fullWidth
      variant="outlined"
      placeholder="Search projects and media..."
      sx={{ mb: 3 }}
    />
    <Card>
      <CardContent>
        <List>
          <ListItem>
            <ListItemText primary="Project X" secondary="Last modified: Yesterday" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Interview.mp4" secondary="Duration: 15:30" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  </Box>
);

export default SearchPage;