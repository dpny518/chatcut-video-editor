import React from 'react';
import { Box, Tabs, Tab, Card, IconButton } from '@mui/material';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';
import { Plus } from 'lucide-react';


const PapercutViewer = ({ transcriptData }) => {
  const { papercuts, activeTab, setActiveTab, createNewPapercut } = usePapercuts();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNewPapercut = () => {
    createNewPapercut();
  };

  const activePapercut = papercuts.find(p => p.id === activeTab);

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      {/* Tab Bar */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Tabs 
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1 }}
        >
          {papercuts.map(papercut => (
            <Tab 
              key={papercut.id}
              label={papercut.name}
              value={papercut.id}
            />
          ))}
        </Tabs>
        <IconButton 
          onClick={handleNewPapercut}
          sx={{ mx: 1 }}
          size="small"
        >
          <Plus size={20} />
        </IconButton>
      </Box>
      
      {/* Content Area */}
      <Box sx={{ 
        flex: 1, 
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