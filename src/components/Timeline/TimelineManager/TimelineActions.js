import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  X
} from 'lucide-react';

const TimelineActions = ({
  onCreateTimeline,
  onDeleteTimeline,
  onDuplicateTimeline,
  currentTimeline = null,
  disabled = false
}) => {
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  
  // Form states
  const [newTimelineName, setNewTimelineName] = useState('');
  const [error, setError] = useState('');

  // Get timeline status - with null check
  const getTimelineStatus = () => {
    if (!currentTimeline) return { canDelete: false, canDuplicate: false };
    
    return {
      canDelete: !currentTimeline.locked && !currentTimeline.isDefault,
      canDuplicate: true
    };
  };

  const timelineStatus = getTimelineStatus();

  // Handle timeline creation
  const handleCreate = () => {
    if (!newTimelineName.trim()) {
      setError('Timeline name is required');
      return;
    }

    try {
      onCreateTimeline(newTimelineName.trim());
      setCreateDialogOpen(false);
      setNewTimelineName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle timeline deletion - with validation
  const handleDelete = () => {
    if (!currentTimeline || !timelineStatus.canDelete) {
      setError('Cannot delete this timeline');
      return;
    }

    try {
      onDeleteTimeline(currentTimeline.id);
      setDeleteDialogOpen(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle timeline duplication - with validation
  const handleDuplicate = () => {
    if (!currentTimeline || !timelineStatus.canDuplicate) {
      setError('Cannot duplicate this timeline');
      return;
    }

    if (!newTimelineName.trim()) {
      setError('New timeline name is required');
      return;
    }

    try {
      onDuplicateTimeline(currentTimeline.id, newTimelineName.trim());
      setDuplicateDialogOpen(false);
      setNewTimelineName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
      {/* Create Timeline Button */}
      <Tooltip title="Create New Timeline">
        <IconButton 
          onClick={() => setCreateDialogOpen(true)}
          disabled={disabled}
          className="text-blue-400 hover:text-blue-300"
        >
          <Plus size={20} />
        </IconButton>
      </Tooltip>

      {/* Delete Timeline Button */}
      <Tooltip title={!timelineStatus.canDelete ? "Cannot delete this timeline" : "Delete Timeline"}>
        <span>
          <IconButton
            onClick={() => setDeleteDialogOpen(true)}
            disabled={disabled || !timelineStatus.canDelete}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={20} />
          </IconButton>
        </span>
      </Tooltip>

      {/* Duplicate Timeline Button */}
      <Tooltip title={!timelineStatus.canDuplicate ? "Cannot duplicate this timeline" : "Duplicate Timeline"}>
        <span>
          <IconButton
            onClick={() => setDuplicateDialogOpen(true)}
            disabled={disabled || !timelineStatus.canDuplicate}
            className="text-green-400 hover:text-green-300"
          >
            <Copy size={20} />
          </IconButton>
        </span>
      </Tooltip>

      {/* Create Timeline Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          setNewTimelineName('');
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          Create New Timeline
          <IconButton onClick={() => setCreateDialogOpen(false)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              className="mb-4"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Timeline Name"
            value={newTimelineName}
            onChange={(e) => setNewTimelineName(e.target.value)}
            fullWidth
            className="mt-2"
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            variant="contained"
            disabled={!newTimelineName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Timeline Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          Delete Timeline
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              className="mb-4"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          <div className="flex items-start gap-3 mt-2">
            <AlertCircle className="text-amber-500 mt-1" size={24} />
            <div>
              <p className="font-medium">Are you sure you want to delete this timeline?</p>
              <p className="text-gray-500 mt-1">
                This action cannot be undone. All clips and effects will be permanently removed.
              </p>
              {currentTimeline?.name && (
                <p className="mt-3 p-2 bg-gray-100 rounded">
                  Timeline: <strong>{currentTimeline.name}</strong>
                </p>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={!timelineStatus.canDelete}
          >
            Delete Timeline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Timeline Dialog */}
      <Dialog
        open={duplicateDialogOpen}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setNewTimelineName('');
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          Duplicate Timeline
          <IconButton onClick={() => setDuplicateDialogOpen(false)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              className="mb-4"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          <div className="mb-4">
            <p className="text-gray-600">
              Create a copy of <strong>{currentTimeline?.name}</strong> with a new name:
            </p>
          </div>
          <TextField
            autoFocus
            label="New Timeline Name"
            value={newTimelineName}
            onChange={(e) => setNewTimelineName(e.target.value)}
            fullWidth
            className="mt-2"
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button 
            onClick={() => setDuplicateDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDuplicate}
            variant="contained"
            disabled={!newTimelineName.trim() || !timelineStatus.canDuplicate}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TimelineActions;