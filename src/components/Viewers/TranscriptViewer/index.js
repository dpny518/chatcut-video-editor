import React, { useMemo, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CircularProgress 
} from '@mui/material';
import { useFileSystem } from '../../../contexts/FileSystemContext';
import { useTranscript } from '../../../hooks/useTranscript';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from 
  '../../../hooks/usePapercut/usePapercutActions';
import { useTranscriptSelection } from 
  '../../../hooks/useTranscript/useTranscriptSelection';
import { useTranscriptStyling } from '../../../contexts/TranscriptStylingContext';
import TranscriptToolbar from './TranscriptToolbar';
import TranscriptContent from './TranscriptContent';
import FileCount from './FileCount';
import useProcessTranscripts from 
  '../../../hooks/useTranscript/useTranscriptProcessing';
import { usePapercutHistory } from '../../../hooks/usePapercutHistory';


const TranscriptViewer = () => {
  const { selectedItems, getTranscriptData, files } = useFileSystem();
  const { handleAddToTimeline } = useTranscript();
  const { activeTab } = usePapercuts();
  const { addToPapercut, insertToPapercut } = usePapercutActions();
  const { highlightedWord } = useTranscript();
  const { addStyle, removeStyle } = useTranscriptStyling();
  const { 
    pushState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = usePapercutHistory();
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey && canRedo) {
          redo();
        } else if (canUndo) {
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, canRedo, undo, redo]);
  
  const transcripts = useMemo(() => {
    const selectedFileIds = selectedItems.filter(id => 
      files[id] && files[id].type !== 'folder'
    );
    return getTranscriptData(selectedFileIds);
  }, [selectedItems, getTranscriptData, files]);

  const [displayContent, isProcessing] = 
    useProcessTranscripts(transcripts);
  
  const { 
    selection, 
    clearSelection, 
    getSelectedContent, 
    handleSelectionChange 
  } = useTranscriptSelection(displayContent);

 

  const handleStyleClick = (style) => {
    if (selection) {
      const selectedContent = getSelectedContent();
      addStyle(selectedContent, style);
      pushState({ type: 'ADD_STYLE', content: selectedContent, style });
      clearSelection();
    }
  };

  const handleRemoveStyle = () => {
    if (selection) {
      const selectedContent = getSelectedContent();
      removeStyle(selectedContent);
      pushState({ type: 'REMOVE_STYLE', content: selectedContent });
      clearSelection();
    }
  };

  const handleAddToPapercut = () => {
    if (selection) {
      const selectedContent = getSelectedContent();
      addToPapercut(activeTab, selectedContent);
      clearSelection();
    }
  };

  const handleInsertToPapercut = () => {
    if (selection) {
      const selectedContent = getSelectedContent();
      insertToPapercut(activeTab, selectedContent);
      clearSelection();
    }
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper' 
    }}
    tabIndex={0}>
      <FileCount count={transcripts.length} />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2, 
          maxWidth: '900px', 
          margin: '0 auto' 
        }}>
          {isProcessing ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </Box>
          ) : (
            <TranscriptContent
              displayContent={displayContent}
              onSelectionChange={handleSelectionChange}
              highlightedWord={highlightedWord}
            />
          )}
        </Box>

        <TranscriptToolbar 
          isSelectionActive={!!selection}
          onAddToPapercut={handleAddToPapercut}
          onInsertToPapercut={handleInsertToPapercut}
          onStyleClick={handleStyleClick}
          onRemoveStyle={handleRemoveStyle}
        />
      </Box>
    </Card>
  );
};

export default TranscriptViewer;