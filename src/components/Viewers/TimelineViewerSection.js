import React from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { FileVideo, FileText } from 'lucide-react';
import PapercutViewerSection from './PapercutViewer/PapercutViewerSection';

const TimelineViewerSection = ({ transcript }) => {
  return (
    <Paper sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
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
          <ToggleButton 
            value="video" 
            disabled
          >
            <FileVideo className="w-4 h-4 mr-2" />
            Video
          </ToggleButton>
          <ToggleButton 
            value="transcript"
          >
            <FileText className="w-4 h-4 mr-2" />
            Papercut
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <PapercutViewerSection
          transcriptData={transcript}
        />
      </Box>
    </Paper>
  );
};

export default TimelineViewerSection;