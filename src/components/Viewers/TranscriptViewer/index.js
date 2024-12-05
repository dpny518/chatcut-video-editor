import React, { useMemo } from 'react';
import { Box, Card, CircularProgress } from '@mui/material';
import { useFileSystem } from '../../../contexts/FileSystemContext';
import { useTranscript } from '../../../hooks/useTranscript';
import { usePapercuts } from '../../../contexts/PapercutContext';
import { usePapercutActions } from '../../../hooks/usePapercut/usePapercutActions';
import { useTranscriptSelection } from '../../../hooks/useTranscript/useTranscriptSelection';
import TranscriptToolbar from './TranscriptToolbar';
import TranscriptContent from './TranscriptContent';
import FileCount from './FileCount';
import useProcessTranscripts from '../../../hooks/useTranscript/useTranscriptProcessing';

const TranscriptViewer = () => {
  const { selectedItems, getTranscriptData, files } = useFileSystem();
  const { handleAddToTimeline } = useTranscript();
  const { activeTab } = usePapercuts();
  const { addToPapercut } = usePapercutActions();
  
  const transcripts = useMemo(() => {
    const selectedFileIds = selectedItems.filter(id => files[id] && files[id].type !== 'folder');
    return getTranscriptData(selectedFileIds);
  }, [selectedItems, getTranscriptData, files]);

  const [displayContent, isProcessing] = useProcessTranscripts(transcripts);
  
  const { selection, clearSelection, getSelectedContent, handleSelectionChange } = useTranscriptSelection(displayContent);

  const handleTimelineAdd = () => {
    if (selection) {
      const selectedContent = getSelectedContent();
      handleAddToTimeline(selectedContent);
      clearSelection();
    }
  };

  const handleAddToPapercut = () => {
    const selectedContent = getSelectedContent();
    console.log('Selected content for Papercut:', selectedContent);
    
    if (selectedContent.length > 0) {
      addToPapercut(activeTab, selectedContent);
      clearSelection();
    } else {
      console.log('No valid selection available for Papercut');
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <FileCount count={transcripts.length} />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, maxWidth: '900px', margin: '0 auto' }}>
          {isProcessing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TranscriptContent
              displayContent={displayContent}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </Box>

        <TranscriptToolbar 
          selectedCount={selection ? 1 : 0}
          onAddToTimeline={handleTimelineAdd}
          onAddToPapercut={handleAddToPapercut}
        />
      </Box>
    </Card>
  );
};

export default TranscriptViewer;