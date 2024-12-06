
// src/components/Pages/SupportPage.js
import { Box, Card, CardContent, TextField, Button , Typography} from '@mui/material';

const SupportPage = () => (
  <Box p={3}>
    <Typography variant="h5" gutterBottom>Support</Typography>
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Contact Support</Typography>
        <TextField
          fullWidth
          label="Subject"
          margin="normal"
        />
        <TextField
          fullWidth
          label="Message"
          multiline
          rows={4}
          margin="normal"
        />
        <Button variant="contained" sx={{ mt: 2 }}>
          Send Message
        </Button>
      </CardContent>
    </Card>
  </Box>
);
export default SupportPage;