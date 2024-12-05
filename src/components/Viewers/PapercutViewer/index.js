import React from 'react';
import { Box, Card } from '@mui/material';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';

const PapercutViewer = ({ transcriptData }) => {
  const { papercuts, activeTab } = usePapercuts();

  const activePapercut = papercuts.find(p => p.id === activeTab);

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      {/* Content Area */}
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        {activePapercut && (
          <PapercutContent
            content={activePapercut.content}
            papercutId={activePapercut.id}
            transcriptData={transcriptData}
          />
        )}
      </Box>
    </Card>
  );
};

export default PapercutViewer;