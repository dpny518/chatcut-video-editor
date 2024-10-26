import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Link,
  ExternalLink,
  Clock,
  AlertTriangle,
  MoreVertical,
  Eye,
  Unlink,
  Copy,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Video
} from 'lucide-react';

/**
 * ReferenceClip Component
 * Displays clips that reference content from other timelines
 */
const ReferenceClip = ({
  reference,
  onSelect,
  onNavigateToSource,
  onUnlink,
  onUpdateReference,
  onDuplicateAsNormal,
  isSelected = false,
  disabled = false
}) => {
  // Local state
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Check reference status
  const hasError = reference.error || !reference.sourceTimeline;
  const isOutdated = reference.needsUpdate;

  return (
    <Paper
      elevation={isSelected ? 2 : 1}
      onClick={() => !disabled && onSelect(reference.id)}
      sx={{
        position: 'relative',
        p: 1.5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: theme => isSelected 
          ? `2px solid ${theme.palette.primary.main}`
          : '2px solid transparent',
        bgcolor: theme => hasError 
          ? theme.palette.error.light 
          : theme.palette.background.paper,
        opacity: disabled ? 0.7 : 1,
        '&:hover': {
          bgcolor: theme => !disabled && theme.palette.action.hover,
          '& .reference-actions': {
            opacity: 1
          }
        }
      }}
    >
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        mb: expanded ? 1 : 0
      }}>
        {/* Expand/Collapse Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          sx={{ p: 0.5 }}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </IconButton>

        {/* Reference Icon & Status */}
        <Tooltip title={hasError ? 'Reference Error' : isOutdated ? 'Update Available' : 'Referenced Clip'}>
          <Badge
            color={hasError ? 'error' : isOutdated ? 'warning' : 'info'}
            variant="dot"
            sx={{ mr: 1 }}
          >
            {hasError ? (
              <AlertTriangle size={18} color="error" />
            ) : (
              <Link size={18} />
            )}
          </Badge>
        </Tooltip>

        {/* Clip Name & Basic Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {reference.name || 'Referenced Clip'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Clock size={12} />
            {formatTime(reference.duration)}
            {reference.sourceTimeline && (
              <>
                <Box component="span" sx={{ mx: 0.5 }}>•</Box>
                <Video size={12} />
                From: {reference.sourceTimeline.name}
              </>
            )}
          </Typography>
        </Box>

        {/* Actions */}
        <Box 
          className="reference-actions"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          {/* Quick Navigate */}
          <Tooltip title="Go to Source">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToSource(reference.sourceTimeline.id, reference.sourceClipId);
              }}
              disabled={disabled || hasError}
            >
              <ExternalLink size={18} />
            </IconButton>
          </Tooltip>

          {/* Update Button */}
          {isOutdated && (
            <Tooltip title="Update Reference">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateReference(reference.id);
                }}
                disabled={disabled}
                color="warning"
              >
                <RefreshCw size={18} />
              </IconButton>
            </Tooltip>
          )}

          {/* More Actions Menu */}
          <Tooltip title="More Actions">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
              disabled={disabled}
            >
              <MoreVertical size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          {hasError ? (
            <Typography
              variant="body2"
              color="error"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1 
              }}
            >
              <AlertTriangle size={16} />
              {reference.error || 'Source timeline or clip not found'}
            </Typography>
          ) : (
            <>
              {/* Time Range */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Time Range:</strong> {formatTime(reference.sourceStart)} - {formatTime(reference.sourceEnd)}
              </Typography>

              {/* Source Info */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Source:</strong> {reference.sourceTimeline.name}
                {reference.sourceClip && ` > ${reference.sourceClip.name}`}
              </Typography>

              {/* Reference Path */}
              {reference.path && reference.path.length > 0 && (
                <Typography variant="body2">
                  <strong>Reference Path:</strong>
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      ml: 1
                    }}
                  >
                    {reference.path.map((item, index) => (
                      <React.Fragment key={item.id}>
                        {index > 0 && <ChevronRight size={14} />}
                        {item.name}
                      </React.Fragment>
                    ))}
                  </Box>
                </Typography>
              )}
            </>
          )}
        </Box>
      </Collapse>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            onNavigateToSource(reference.sourceTimeline.id, reference.sourceClipId);
            setMenuAnchor(null);
          }}
          disabled={hasError}
        >
          <ListItemIcon>
            <Eye size={18} />
          </ListItemIcon>
          <ListItemText>View Source</ListItemText>
        </MenuItem>

        {isOutdated && (
          <MenuItem
            onClick={() => {
              onUpdateReference(reference.id);
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <RefreshCw size={18} />
            </ListItemIcon>
            <ListItemText>Update Reference</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            onDuplicateAsNormal(reference.id);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Copy size={18} />
          </ListItemIcon>
          <ListItemText>Convert to Normal Clip</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onUnlink(reference.id);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Unlink size={18} />
          </ListItemIcon>
          <ListItemText>Break Reference</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ReferenceClip;