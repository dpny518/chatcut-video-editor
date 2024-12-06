import React, { useState } from 'react';
import { 
  Box, 
  Paper,
  Tabs,
  Tab,
  Typography,
  SvgIcon
} from '@mui/material';
import TranscriptViewer from './TranscriptViewer';
import { ReactComponent as TranscriptIcon } from '../../images/icons/gg_transcript.svg';
import { ReactComponent as PlayIcon } from '../../images/icons/gg_play.svg';
const BinViewerSection = () => {
  const [viewMode, setViewMode] = useState(1);

  const handleViewChange = (e, newValue) => setViewMode(newValue);
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
          onChange={handleViewChange}
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              color: 'text.secondary'
            }
          }}
        >
          <Tab
            icon={<CustomIcon Icon={PlayIcon} alt="Play" color="text.disabled" />}
            iconPosition="start"
            label="VIDEO"
            disabled
            sx={{
              opacity: 0.5,
              '&.Mui-disabled': {
                color: 'text.disabled'
              },
              '& .MuiTab-iconWrapper': {
                marginRight: 1  // Add space between icon and text
              }
            }}
          />
          <Tab
            icon={<CustomIcon Icon={TranscriptIcon} alt="Transcript" />}
            iconPosition="start"
            label="TRANSCRIPT"
            sx={{
              '& .MuiTab-iconWrapper': {
                marginRight: 1  // Add space between icon and text
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
        {viewMode === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Video viewer coming soon
            </Typography>
          </Box>
        ) : (
          <TranscriptViewer />
        )}
      </Box>
    </Paper>
  );
};


export default BinViewerSection;