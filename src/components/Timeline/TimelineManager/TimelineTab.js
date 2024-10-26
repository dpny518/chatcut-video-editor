import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Clock,
  Video,
  Lock,
  EyeOff,
  AlertCircle,
  MoreVertical,
  PlayCircle,
  PauseCircle,
  Copy,
  Trash2,
  Edit2,
  Eye,
  EyeOff as Hide,
  LockOpen,
  Download,
  Upload
} from 'lucide-react';

/**
 * TimelineTab Component
 * Individual timeline tab showing timeline name and status with context actions
 */
const TimelineTab = ({ 
  timeline = {}, // Provide default empty object
  isActive = false, 
  onSelect = () => {},
  onPlay = () => {},
  onPause = () => {},
  onEdit = () => {},
  onDuplicate = () => {},
  onDelete = () => {},
  onToggleVisibility = () => {},
  onToggleLock = () => {},
  onExport = () => {},
  onImport = () => {},
  isPlaying = false,
  disabled = false
}) => {
  // Menu state
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  // Format duration for display
  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status information with null checks
  const getStatusInfo = () => {
    if (!timeline) return { icon: AlertCircle, label: 'Error', color: 'error.main' };
    
    if (timeline.locked === true) return { icon: Lock, label: 'Locked', color: 'error.main' };
    if (timeline.hidden === true) return { icon: EyeOff, label: 'Hidden', color: 'text.secondary' };
    if (timeline.error === true) return { icon: AlertCircle, label: 'Error', color: 'error.main' };
    if (timeline.processing === true) return { icon: Clock, label: 'Processing', color: 'warning.main' };
    return { icon: Video, label: 'Ready', color: 'success.main' };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  // Early return if no timeline
  if (!timeline || !timeline.id) {
    return null;
  }

  return (
    <Box
      onClick={() => !disabled && onSelect(timeline.id)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        minWidth: 200,
        maxWidth: 300,
        bgcolor: theme => isActive 
          ? theme.palette.action.selected 
          : 'transparent',
        borderLeft: theme => isActive 
          ? `2px solid ${theme.palette.primary.main}`
          : '2px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled || timeline.hidden ? 0.7 : 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: theme => !disabled && theme.palette.action.hover,
          '& .timeline-actions': {
            opacity: 1
          }
        }
      }}
    >
      {/* Status Icon */}
      <Tooltip title={status.label}>
        <StatusIcon 
          size={18} 
          color={status.color}
          style={{ flexShrink: 0 }}
        />
      </Tooltip>

      {/* Timeline Info */}
      <Box sx={{ 
        flex: 1,
        minWidth: 0, // Enable text truncation
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
      }}>
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            fontWeight: isActive ? 600 : 400,
            color: timeline.error ? 'error.main' : 'text.primary'
          }}
        >
          {timeline.name || 'Untitled Timeline'}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          color: 'text.secondary'
        }}>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Clock size={12} />
            {formatDuration(timeline.duration)}
          </Typography>

          {timeline.clipCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              •
              <Video size={12} />
              {timeline.clipCount} clips
            </Typography>
          )}
        </Box>
      </Box>

      {/* Actions */}
      <Box 
        className="timeline-actions"
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        {/* Play/Pause Button */}
        {!disabled && (
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? onPause(timeline.id) : onPlay(timeline.id);
              }}
              sx={{ color: isPlaying ? 'primary.main' : 'action.active' }}
            >
              {isPlaying ? (
                <PauseCircle size={18} />
              ) : (
                <PlayCircle size={18} />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* More Actions Menu */}
        <Tooltip title="More actions">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
            disabled={disabled}
          >
            <MoreVertical size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => {
            onEdit(timeline.id);
            setAnchorEl(null);
          }}
          disabled={timeline.locked}
        >
          <ListItemIcon>
            <Edit2 size={18} />
          </ListItemIcon>
          <ListItemText>Edit Timeline</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onDuplicate(timeline.id);
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Copy size={18} />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => {
            onToggleVisibility(timeline.id);
            setAnchorEl(null);
          }}
          disabled={timeline.locked}
        >
          <ListItemIcon>
            {timeline.hidden ? <Eye size={18} /> : <Hide size={18} />}
          </ListItemIcon>
          <ListItemText>
            {timeline.hidden ? 'Show Timeline' : 'Hide Timeline'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onToggleLock(timeline.id);
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            {timeline.locked ? <LockOpen size={18} /> : <Lock size={18} />}
          </ListItemIcon>
          <ListItemText>
            {timeline.locked ? 'Unlock Timeline' : 'Lock Timeline'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          onExport(timeline.id);
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Download size={18} />
          </ListItemIcon>
          <ListItemText>Export Timeline</ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => {
            onImport(timeline.id);
            setAnchorEl(null);
          }}
          disabled={timeline.locked}
        >
          <ListItemIcon>
            <Upload size={18} />
          </ListItemIcon>
          <ListItemText>Import Timeline</ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => {
            onDelete(timeline.id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
          disabled={timeline.locked}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Trash2 size={18} />
          </ListItemIcon>
          <ListItemText>Delete Timeline</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TimelineTab;