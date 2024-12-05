import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import PapercutViewer from './index';
import { usePapercuts } from '../../../contexts/PapercutContext';

const PapercutViewerSection = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();

  const [anchorEl, setAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('papercut');

  useEffect(() => {
    if (papercuts.length > 0 && (!activeTab || !papercuts.find(p => p.id === activeTab))) {
      setActiveTab(papercuts[0].id);
    }
  }, [papercuts, activeTab, setActiveTab]);

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

  const activePapercut = papercuts.find(p => p.id === activeTab) || papercuts[0];

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
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Files Selected
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => setViewMode('video')} 
            disabled={viewMode === 'video'}
            sx={{ 
              mr: 1, 
              opacity: viewMode === 'video' ? 1 : 0.5,
              color: viewMode === 'video' ? 'primary.main' : 'text.secondary'
            }}
          >
            <PlayCircleOutlineIcon />
          </IconButton>
          <IconButton 
            onClick={() => setViewMode('papercut')} 
            disabled={viewMode === 'papercut'}
            sx={{ 
              mr: 2, 
              opacity: viewMode === 'papercut' ? 1 : 0.5,
              color: viewMode === 'papercut' ? 'primary.main' : 'text.secondary'
            }}
          >
            <TextSnippetIcon />
          </IconButton>
          <Typography variant="subtitle1">
            {activePapercut ? activePapercut.name : 'No Papercuts'}
          </Typography>
          <IconButton onClick={handleMenuClick} size="small">
            <ChevronDown />
          </IconButton>
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
        </Box>
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {viewMode === 'video' ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Video viewer coming soon
            </Typography>
          </Box>
        ) : (
          <PapercutViewer transcriptData={transcriptData} />
        )}
      </Box>
    </Paper>
  );
};

export default PapercutViewerSection;