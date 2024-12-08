import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper,
  Tabs,
  Tab,
  Typography,
  Menu,
  MenuItem,
  SvgIcon,
  IconButton
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import PapercutViewer from './index';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from '../../../hooks/usePapercut/usePapercutActions';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';

const PapercutViewerSection = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();
  const { insertToPapercut } = usePapercutActions();
  const [isDragOver, setIsDragOver] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [viewMode, setViewMode] = React.useState(1);

  const CustomIcon = ({ Icon, alt, color = 'primary.main' }) => {
    return (
      <SvgIcon
        component={Icon}
        inheritViewBox
        sx={{
          width: 24,
          height: 24,
          '& path, & rect': {
            stroke: color,
          },
        }}
      />
    );
  };

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

  const activePapercut = papercuts.find(p => p.id === activeTab);

  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/transcript-selection')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/transcript-selection');
      if (data && activeTab) {
        const selectedContent = JSON.parse(data);
        insertToPapercut(activeTab, selectedContent);
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  };

  return (
    <Paper 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
        height: '100%',
        '& > *': { margin: 0 },
        transition: 'all 0.2s ease',
        border: isDragOver ? '2px dashed' : '2px solid transparent',
        borderColor: isDragOver ? 'primary.main' : 'transparent',
      }}
    >
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper' 
      }}>
        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              color: 'text.secondary'
            }
          }}
        >
          <Tab
            icon={<CustomIcon Icon={PlayCircleOutlineIcon} alt="Play" color="text.disabled" />}
            iconPosition="start"
            label="VIDEO"
            disabled
            sx={{
              opacity: 0.5,
              '&.Mui-disabled': {
                color: 'text.disabled'
              },
              '& .MuiTab-iconWrapper': {
                marginRight: 1
              }
            }}
          />
          <Tab
            icon={<CustomIcon Icon={DescriptionIcon} alt="Transcript" />}
            iconPosition="start"
            label="PAPERCUT"
            sx={{
              '& .MuiTab-iconWrapper': {
                marginRight: 1
              }
            }}
          />
        </Tabs>
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <PapercutViewer transcriptData={transcriptData} />
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
    </Paper>
  );
};

export default PapercutViewerSection;