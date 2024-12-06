import React, { useEffect } from 'react';
import { 
  Box, 
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { ChevronDown } from 'lucide-react';
import PapercutViewer from './index';
import { usePapercuts } from '../../../contexts/PapercutContext';

const PapercutViewerSection = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();

  const [anchorEl, setAnchorEl] = React.useState(null);

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
        bgcolor: 'background.paper' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          minHeight: 48,
          px: 2
        }}>
          <IconButton
            disabled
            sx={{
              opacity: 0.5,
              color: 'text.disabled',
              mr: 1
            }}
          >
            <PlayCircleOutlineIcon />
          </IconButton>
          <Typography 
            sx={{ 
              color: 'text.disabled',
              fontSize: '0.875rem',
              fontWeight: 500,
              mr: 2
            }}
          >
            VIDEO
          </Typography>
          <IconButton
            sx={{
              color: 'primary.main',
              mr: 1
            }}
          >
            <TextSnippetIcon />
          </IconButton>
          <Typography 
            sx={{ 
              color: 'primary.main',
              fontSize: '0.875rem',
              fontWeight: 500,
              flexGrow: 1
            }}
          >
            PAPERCUT
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'primary.main',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {activePapercut ? activePapercut.name : 'No Papercuts'}
            </Typography>
            <IconButton onClick={handleMenuClick} size="small">
              <ChevronDown />
            </IconButton>
          </Box>
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

      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <PapercutViewer transcriptData={transcriptData} />
      </Box>
    </Paper>
  );
};

export default PapercutViewerSection;