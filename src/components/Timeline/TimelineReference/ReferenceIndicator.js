import React, { useState } from 'react';
import {
  Box,
  Tooltip,
  Badge,
  Popover,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Link,
  Video,
  Folder,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  ChevronRight
} from 'lucide-react';

/**
 * ReferenceIndicator Component
 * Visual indicator showing clip references and their sources
 */
const ReferenceIndicator = ({
  sourceType,
  sourceId,
  referenceData,
  onNavigateToSource,
  onUpdateReference,
  className,
  size = 'medium',
}) => {
  // Local state for popover
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Determine indicator appearance based on status
  const getIndicatorProps = () => {
    if (!referenceData) {
      return {
        color: 'error',
        icon: AlertTriangle,
        tooltip: 'Reference Not Found',
        status: 'error'
      };
    }

    if (referenceData.needsUpdate) {
      return {
        color: 'warning',
        icon: RefreshCw,
        tooltip: 'Update Available',
        status: 'warning'
      };
    }

    if (sourceType === 'bin') {
      return {
        color: 'info',
        icon: Folder,
        tooltip: 'Media Bin Reference',
        status: 'info'
      };
    }

    return {
      color: 'primary',
      icon: Link,
      tooltip: 'Timeline Reference',
      status: 'success'
    };
  };

  const { color, icon: Icon, tooltip, status } = getIndicatorProps();

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Main Indicator */}
      <Tooltip title={tooltip}>
        <Badge
          variant="dot"
          color={color}
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <IconButton
            size={size}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: `${color}.lighter`,
              '&:hover': {
                bgcolor: `${color}.light`
              }
            }}
          >
            <Icon 
              size={size === 'small' ? 16 : 20}
              className={referenceData?.needsUpdate ? 'rotating' : ''}
            />
          </IconButton>
        </Badge>
      </Tooltip>

      {/* Reference Details Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          pointerEvents: 'none',
          '& .MuiPopover-paper': {
            pointerEvents: 'auto'
          }
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 400 }}>
          {!referenceData ? (
            // Error State
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'error.main' 
            }}>
              <AlertTriangle size={20} />
              <Typography>Reference not found or invalid</Typography>
            </Box>
          ) : (
            // Reference Details
            <>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 1.5 
              }}>
                {sourceType === 'bin' ? (
                  <Video size={20} />
                ) : (
                  <Link size={20} />
                )}
                <Typography variant="subtitle2">
                  {referenceData.name || (sourceType === 'bin' ? 'Media File' : 'Timeline Clip')}
                </Typography>
              </Box>

              {/* Source Info */}
              <Box sx={{ mb: 1.5 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.5
                  }}
                >
                  <Clock size={16} />
                  Duration: {formatTime(referenceData.duration)}
                </Typography>

                {sourceType === 'timeline' && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 0.5
                    }}
                  >
                    Source Path:
                    {referenceData.path?.map((item, index) => (
                      <React.Fragment key={item.id}>
                        {index > 0 && <ChevronRight size={14} />}
                        <span>{item.name}</span>
                      </React.Fragment>
                    ))}
                  </Typography>
                )}
              </Box>

              {/* Time Range */}
              {referenceData.sourceStart !== undefined && (
                <Box sx={{ 
                  mb: 1.5,
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Source Range
                  </Typography>
                  <Typography variant="body2">
                    {formatTime(referenceData.sourceStart)} - {formatTime(referenceData.sourceEnd)}
                  </Typography>
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                borderTop: 1,
                borderColor: 'divider',
                pt: 1.5
              }}>
                {/* Navigate to Source */}
                <IconButton
                  size="small"
                  onClick={() => {
                    onNavigateToSource?.(sourceId, referenceData.sourceClipId);
                    setAnchorEl(null);
                  }}
                  sx={{ bgcolor: 'action.hover' }}
                >
                  <Tooltip title="Go to Source">
                    <ExternalLink size={16} />
                  </Tooltip>
                </IconButton>

                {/* Update Reference */}
                {referenceData.needsUpdate && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      onUpdateReference?.(referenceData.id);
                      setAnchorEl(null);
                    }}
                    color="warning"
                    sx={{ bgcolor: 'warning.lighter' }}
                  >
                    <Tooltip title="Update Reference">
                      <RefreshCw size={16} />
                    </Tooltip>
                  </IconButton>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Popover>

      <style jsx global>{`
        .rotating {
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
};

export default ReferenceIndicator;