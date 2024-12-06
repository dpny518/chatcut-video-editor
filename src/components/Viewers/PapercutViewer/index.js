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

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper' 
    }}
    tabIndex={0}>
      <ActivePapercut 
        name={activePapercut ? activePapercut.name : null}
        onMenuClick={handleMenuClick}
      />
      
      <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}>
          <Box sx={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            p: 2
          }}>
            {activePapercut && (
              <PapercutContent papercutId={activePapercut.id} />
            )}
          </Box>
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