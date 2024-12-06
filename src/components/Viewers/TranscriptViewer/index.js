import React, { useMemo } from 'react';
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


const TranscriptViewer = () => {
  const { selectedItems, getTranscriptData, files } = useFileSystem();
  const { handleAddToTimeline } = useTranscript();
  const { activeTab } = usePapercuts();
  const { addToPapercut, insertToPapercut } = usePapercutActions();
  const { highlightedWord } = useTranscript();
  const { addStyle } = useTranscriptStyling();
  
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
      // Pass the entire selectedContent to addStyle
      addStyle(selectedContent, style);
      clearSelection();
    }
  };

  const handleTimelineAdd = () => {
    if (selection) {
      const selectedContent = getSelectedContent();
      handleAddToTimeline(selectedContent);
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
    }}>
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
          onAddToTimeline={handleTimelineAdd}
          onAddToPapercut={handleAddToPapercut}
          onInsertToPapercut={handleInsertToPapercut}
          onStyleClick={handleStyleClick}
        />
      </Box>
    </Card>
  );
};

export default TranscriptViewer;