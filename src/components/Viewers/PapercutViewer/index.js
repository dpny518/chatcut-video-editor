import React from 'react';
import { Box, Tabs, Tab, Card } from '@mui/material';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';

const PapercutViewer = () => {
  const { papercuts, activeTab, setActiveTab } = usePapercuts();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const activePapercut = papercuts.find(p => p.id === activeTab);

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {papercuts.map(papercut => (
            <Tab 
              key={papercut.id}
              label={papercut.name}
              value={papercut.id}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activePapercut && (
          <PapercutContent
            content={activePapercut.content}
            papercutId={activePapercut.id}
          />
        )}
      </Box>
    </Card>
  );
};

export default PapercutViewer;