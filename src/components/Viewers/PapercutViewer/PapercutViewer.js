import React from 'react';
import { 
  Box, 
  Card,
  Menu,
  MenuItem,
} from '@mui/material';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';
import ActivePapercut from './ActivePapercut';
import { TranscriptClipboardProvider } from '../../../contexts/TranscriptClipboardContext';

// PapercutViewer.js
const PapercutViewer = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const activePapercut = papercuts.find(p => p.id === activeTab);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePapercutSelect = (id) => {
    setActiveTab(id);
    handleMenuClose();
  };

  const handleNewPapercut = () => {
    createNewPapercut();
    handleMenuClose();
  };

  const handleInsertToPapercut = (selectedContent) => {
    // Logic to handle the insertion of selected content into the papercut
    console.log('Inserting content:', selectedContent);
    // You can add your logic here to update the state or perform any other actions
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
      tabIndex={0}
    >
      <ActivePapercut 
        name={activePapercut ? activePapercut.name : null}
        onMenuClick={handleMenuClick}
      />
      
      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {activePapercut && (
          <TranscriptClipboardProvider>
            <PapercutContent onHandleInsert={handleInsertToPapercut}>
              <PapercutContent papercutId={activePapercut.id} />
            </PapercutContent>
          </TranscriptClipboardProvider>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {papercuts.map((papercut) => (
          <MenuItem 
            key={papercut.id} 
            onClick={() => handlePapercutSelect(papercut.id)}
          >
            {papercut.name}
          </MenuItem>
        ))}
        <MenuItem onClick={handleNewPapercut}>New Papercut</MenuItem>
      </Menu>
    </Card>
  );
};

export default PapercutViewer; 