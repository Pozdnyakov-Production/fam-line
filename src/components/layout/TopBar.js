// src/components/layout/TopBar.js
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Badge, Box, Popover, TextField, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markAllRead } from '../../store/notificationsSlice';
import { logout } from '../../store/authSlice';

export default function TopBar() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(state => state.notifications.items);
  const unreadCount = useSelector(state => state.notifications.unread);
  const users = useSelector(state => state.auth.users);
  const currentUser = useSelector(state => state.auth.user);

  const [searchAnchor, setSearchAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchOpen = (e) => setSearchAnchor(e.currentTarget);
  const handleSearchClose = () => { setSearchAnchor(null); setSearchQuery(''); setSearchResults([]); };
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 0) {
      setSearchResults(users.filter(u =>
        u.id !== currentUser.id &&
        (u.firstName.toLowerCase().includes(q.toLowerCase()) ||
         u.lastName.toLowerCase().includes(q.toLowerCase()))
      ));
    } else {
      setSearchResults([]);
    }
  };

  const [notifAnchor, setNotifAnchor] = useState(null);
  const handleNotifOpen = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => { setNotifAnchor(null); dispatch(markAllRead()); };

  const [profileAnchor, setProfileAnchor] = useState(null);
  const handleProfileOpen = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);
  const handleLogout = () => { dispatch(logout()); handleProfileClose(); };
  const handleProfileClick = () => { navigate('/profile'); handleProfileClose(); };
  const handleSettingsClick = () => { navigate('/settings'); handleProfileClose(); };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: theme.zIndex.appBar + 1,
        backgroundColor: 'background.paper',
        borderBottom: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 1, minHeight: 56, pr: { xs: 1, sm: 2 } }}>
        <IconButton onClick={handleSearchOpen} size="large">
          <SearchIcon />
        </IconButton>

        <IconButton onClick={handleNotifOpen} size="large">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleProfileOpen}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{currentUser?.firstName?.[0]}</Avatar>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {currentUser?.firstName}
          </Typography>
          <ArrowDropDownIcon fontSize="small" />
        </Box>
      </Toolbar>

      <Popover
        open={Boolean(searchAnchor)}
        anchorEl={searchAnchor}
        onClose={handleSearchClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 360 }, maxHeight: 400, mt: 1, borderRadius: 2, boxShadow: 3 } }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск людей…"
            value={searchQuery}
            onChange={handleSearchInput}
            autoFocus
          />
          <List dense sx={{ mt: 1 }}>
            {searchResults.length > 0 ? (
              searchResults.map(user => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => { navigate(`/profile/${user.id}`); handleSearchClose(); }}
                >
                  <ListItemAvatar>
                    <Avatar>{user.firstName?.[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.username} />
                </ListItem>
              ))
            ) : (
              searchQuery.trim().length > 0 && (
                <ListItem>
                  <ListItemText primary="Пользователь не найден" />
                </ListItem>
              )
            )}
          </List>
        </Box>
      </Popover>

      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 360 }, maxHeight: 400, mt: 1, borderRadius: 2, boxShadow: 3 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>Уведомления</Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={() => dispatch(markAllRead())}
            >
              Прочитано всё
            </Typography>
          )}
        </Box>
        <Divider />
        <List dense>
          {notifications.length === 0 ? (
            <ListItem><ListItemText primary="Нет уведомлений" /></ListItem>
          ) : (
            notifications.map(notif => (
              <ListItem key={notif.id} sx={{ backgroundColor: notif.is_read ? 'transparent' : 'action.hover' }}>
                <ListItemText primary={notif.message} secondary={new Date(notif.created_at).toLocaleString()} />
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={handleProfileClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 200, mt: 1, borderRadius: 2, boxShadow: 3 } }}
      >
        <List dense>
          <MenuItem onClick={handleProfileClick}>
            <ListItemText primary="Профиль" />
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <ListItemText primary="Настройки" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemText primary="Выйти" />
          </MenuItem>
        </List>
      </Popover>
    </AppBar>
  );
}