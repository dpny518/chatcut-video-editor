// src/components/Media/SortControls.js
import { Box, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';

export const SortControls = ({ sortBy, sortDirection, onSortChange, onDirectionToggle }) => (
  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
    <FormControl size="small" fullWidth>
      <InputLabel>Sort By</InputLabel>
      <Select value={sortBy} label="Sort By" onChange={onSortChange}>
        <MenuItem value="name">Name</MenuItem>
        <MenuItem value="date">Upload Date</MenuItem>
        <MenuItem value="size">Size</MenuItem>
        <MenuItem value="duration">Duration</MenuItem>
        <MenuItem value="type">Type</MenuItem>
      </Select>
    </FormControl>
    <IconButton onClick={onDirectionToggle} size="small">
      <SortIcon sx={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }} />
    </IconButton>
  </Box>
);