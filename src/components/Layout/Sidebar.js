import React from 'react';
import { Box, IconButton, Tooltip, Badge, Divider } from '@mui/material';
import {
  Home,
  Search,
  Notifications,
  Person,
  Settings,
  Help,
  Payment,
  Brightness4,
  Brightness7
} from '@mui/icons-material';


const Sidebar = ({ onPageChange, currentPage, themeMode, onThemeChange }) => {
  const navItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Search, label: 'Search', id: 'search' },
    { icon: Notifications, label: 'Notifications', id: 'notifications', badge: 2 },
    { icon: Person, label: 'Profile', id: 'profile' },
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: Payment, label: 'Billing', id: 'billing' },
    { icon: Help, label: 'Support', id: 'support' }
  ];

  return (
    <Box
      sx={{
        width: 72,
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        gap: 2
      }}
    >
      {navItems.map((item) => (
        <Tooltip key={item.id} title={item.label} placement="right">
          <Badge
            badgeContent={item.badge}
            color="error"
            sx={{ '& .MuiBadge-badge': { right: 4, top: 4 } }}
          >
            <IconButton
              onClick={() => onPageChange(item.id)}
              color={currentPage === item.id ? 'primary' : 'inherit'}
              sx={{
                p: 2,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <item.icon />
            </IconButton>
          </Badge>
        </Tooltip>
      ))}

      <Divider sx={{ width: '80%', my: 2 }} />
      
      <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`} placement="right">
        <IconButton
          onClick={() => onThemeChange()}
          sx={{
            p: 2,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default Sidebar;