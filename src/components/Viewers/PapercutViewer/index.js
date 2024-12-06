import React from 'react';
import { 
  Box, 
  Paper,
  Typography 
} from '@mui/material';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';

const PapercutViewer = () => {
  const { papercuts, activeTab } = usePapercuts();
  const activePapercut = papercuts.find(p => p.id === activeTab);

  return (
    <Paper sx={{ 
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      overflow: 'hidden',
      height: '100%'
    }}>
      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          py: 1.5,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}>
          <Typography 
            variant="body2"
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {activePapercut ? activePapercut.name : 'No Papercuts'}
          </Typography>
        </Box>
        {activePapercut && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <PapercutContent papercutId={activePapercut.id} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PapercutViewer;