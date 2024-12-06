// src/components/Pages/BillingPage.js
import { Box, Card, CardContent, Button, Chip, Typography } from '@mui/material';

const BillingPage = () => (
  <Box p={3}>
    <Typography variant="h5" gutterBottom>Billing</Typography>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Current Plan</Typography>
        <Chip label="Pro" color="primary" sx={{ mb: 2 }} />
        <Typography>$29/month</Typography>
        <Button variant="outlined" sx={{ mt: 2 }}>
          Change Plan
        </Button>
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Payment Method</Typography>
        <Typography>•••• •••• •••• 4242</Typography>
        <Button variant="text" sx={{ mt: 2 }}>
          Update Payment Method
        </Button>
      </CardContent>
    </Card>
  </Box>
);

export default BillingPage;