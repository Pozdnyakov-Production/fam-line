import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, IconButton, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import TaskIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../../store/authSlice';

const menuItems = ['home', 'tasks', 'chat', 'bank', 'search', 'calendar', 'family'];

const defaultItems = {
  home: { label: 'Главная', path: '/', icon: <HomeIcon /> },
  tasks: { label: 'Задачи', path: '/tasks', icon: <TaskIcon /> },
  chat: { label: 'Сообщения', path: '/chat', icon: <ChatIcon /> },
  bank: { label: 'Банк', path: '/bank', icon: <AccountBalanceIcon /> },
  search: { label: 'Поиск', path: '/search', icon: <SearchIcon /> },
  calendar: { label: 'Календарь', path: '/calendar', icon: <CalendarTodayIcon /> },
  family: { label: 'Семья', path: '/family', icon: <FamilyRestroomIcon /> },
};

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleMenuItems = useSelector(state => state.settings.visibleMenuItems);
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const drawerWidth = 220;

  const drawerContent = (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <Box component="img" src="/logo.png" alt="Family" sx={{ height: 36 }} />
      </Box>
      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map(itemId => {
          const item = defaultItems[itemId];
          if (!item || visibleMenuItems?.[itemId] === false) return null;
          return (
            <ListItemButton
              key={itemId}
              component={NavLink}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                mb: 0.5,
                color: 'text.primary',
                '&.active': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          );
        })}
      </List>
      {user && (
        <Box sx={{ p: 1 }}>
          <ListItemButton onClick={() => dispatch(logout())} sx={{ borderRadius: 3 }}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          sx={{ position: 'fixed', top: 16, left: 16, zIndex: theme.zIndex.appBar + 2, bgcolor: 'background.paper', boxShadow: 2 }}
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #1E1E2F 0%, #2A2A3C 100%)'
              : 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            marginTop: { xs: 0, md: '56px' },
            height: { xs: '100%', md: 'calc(100% - 56px)' },
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}