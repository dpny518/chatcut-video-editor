// src/components/Media/FileItem.js
import { ListItem, ListItemIcon, ListItemText, Checkbox } from '@mui/material';
import { getFileIcon, formatFileSize, formatDuration } from './utils';

export const FileItem = ({ file, selected, onSelect, onCheckboxChange }) => (
  <ListItem 
    onClick={(e) => onSelect(e, file)}
    selected={selected}
    sx={{
      borderBottom: 1,
      borderColor: 'divider',
      cursor: 'pointer',
      ...(selected && {
        bgcolor: 'action.selected',
        '&:hover': {
          bgcolor: 'action.selected'
        }
      })
    }}
  >
    <ListItemIcon sx={{ minWidth: 40 }}>
      <Checkbox
        edge="start"
        checked={selected}
        onChange={(e) => onCheckboxChange(e, file)}
        onClick={(e) => e.stopPropagation()}
      />
      {getFileIcon(file.type)}
    </ListItemIcon>
    <ListItemText 
      primary={file.name}
      secondary={
        <>
          {formatFileSize(file.size)}
          {file.duration && ` • ${formatDuration(file.duration)}`}
        </>
      }
      primaryTypographyProps={{
        variant: 'body2',
        noWrap: true
      }}
    />
  </ListItem>
);