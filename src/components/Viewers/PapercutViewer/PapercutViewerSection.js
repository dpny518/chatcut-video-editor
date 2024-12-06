import React, { useEffect } from 'react';
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
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';

const PapercutViewerSection = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [viewMode, setViewMode] = React.useState(1);  // 0 for Video, 1 for Papercut

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

  return (
    <Paper sx={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
        height: '100%',
        '& > *': {  // This will remove any default margins between children
          margin: 0
        }
      }}>
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