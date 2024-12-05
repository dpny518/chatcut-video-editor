import React from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton, Tabs, Tab, IconButton } from '@mui/material';
import { FileVideo, FileText, Plus } from 'lucide-react';
import PapercutViewer from './index';
import { usePapercuts } from '../../../contexts/PapercutContext';

const PapercutViewerSection = ({ transcriptData }) => {
  const { 
    papercuts, 
    activeTab, 
    setActiveTab, 
    createNewPapercut 
  } = usePapercuts();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNewPapercut = () => {
    createNewPapercut();
  };

  const activePapercut = papercuts.find(p => p.id === activeTab);

  return (
    <Paper sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ typography: 'subtitle1' }}>
          Papercut Editor
        </Box>
        <ToggleButtonGroup
          value="transcript"
          exclusive
          size="small"
        >
          <ToggleButton value="video" disabled>
            <FileVideo className="w-4 h-4 mr-2" />
            Video
          </ToggleButton>
          <ToggleButton value="transcript">
            <FileText className="w-4 h-4 mr-2" />
            Papercut
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* PapercutViewer */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PapercutViewer transcriptData={transcriptData} />
      </Box>
    </Paper>
  );
};

export default PapercutViewerSection;