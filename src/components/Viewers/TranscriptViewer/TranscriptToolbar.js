import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import { 
  Add as AddIcon, 
  InsertComment as InsertIcon,
  BorderColor as HighlightIcon,
  StrikethroughS as StrikeIcon,
  FormatClear as ClearIcon
} from '@mui/icons-material';

const TranscriptToolbar = ({ 
  isSelectionActive, 
  onAddToPapercut, 
  onInsertToPapercut,
  onStyleClick,
  onRemoveStyle
}) => {
  return (
    <Box sx={{ 
      p: 2, 
      borderTop: 1, 
      borderColor: 'divider',
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <ButtonGroup>
        <Button
          variant="contained"
          onClick={onAddToPapercut}
          startIcon={<AddIcon />}
          color="secondary"
          disabled={!isSelectionActive}
        >
          Add to Papercut
        </Button>
        <Button
          variant="contained"
          onClick={onInsertToPapercut}
          startIcon={<InsertIcon />}
          color="primary"
          disabled={!isSelectionActive}
        >
          Insert to Papercut
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button
          variant="contained"
          onClick={() => onStyleClick('highlight-green')}
          startIcon={<HighlightIcon />}
          disabled={!isSelectionActive}
          sx={{ 
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' }
          }}
        >
          Green Highlight
        </Button>
        <Button
          variant="contained"
          onClick={() => onStyleClick('highlight-red')}
          startIcon={<HighlightIcon />}
          disabled={!isSelectionActive}
          sx={{ 
            bgcolor: 'error.main',
            '&:hover': { bgcolor: 'error.dark' }
          }}
        >
          Red Highlight
        </Button>
        <Button
          variant="contained"
          onClick={() => onStyleClick('strikethrough')}
          startIcon={<StrikeIcon />}
          disabled={!isSelectionActive}
        >
          Strikethrough
        </Button>
        <Button
          variant="contained"
          onClick={onRemoveStyle}
          startIcon={<ClearIcon />}
          disabled={!isSelectionActive}
        >
          Remove Style
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default TranscriptToolbar;