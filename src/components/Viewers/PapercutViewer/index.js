import React from 'react';
import { 
  Box, 
  Paper,
  Tabs,
  Tab,
  Typography 
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { ChevronDown } from 'lucide-react';
import { usePapercuts } from '../../../contexts/PapercutContext';
import PapercutContent from './PapercutContent';

const PapercutViewer = ({ transcriptData }) => {
  const { papercuts, activeTab } = usePapercuts();
  const activePapercut = papercuts.find(p => p.id === activeTab);

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
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          py: 1.5,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}>
          <Typography 
            variant="body2"
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {activePapercut ? activePapercut.name : 'No Papercuts'}
          </Typography>
        </Box>
        {activePapercut && (
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
            <PapercutContent
              content={activePapercut.content}
              papercutId={activePapercut.id}
              transcriptData={transcriptData}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PapercutViewer;