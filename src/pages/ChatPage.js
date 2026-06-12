import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemText, Button, Typography, Paper, Container,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Autocomplete, Avatar, Chip, Alert,
} from '@mui/material';
import { fetchRooms, createRoom, createDirectRoom } from '../store/chatSlice';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChatPage() {
  const { roomId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const rooms = useSelector(state => state.chat.rooms);
  const users = useSelector(state => state.auth.users);
  const currentUser = useSelector(state => state.auth.user);
  const [tab, setTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Загружаем комнаты при монтировании и при смене пользователя
  useEffect(() => {
    if (currentUser) {
      setLoadingRooms(true);
      dispatch(fetchRooms()).finally(() => setLoadingRooms(false));
    }
  }, [dispatch, currentUser]);

  // Групповые и личные комнаты
  const groupRooms = rooms.filter(r => r.type !== 'direct');
  const directRooms = rooms.filter(r => r.type === 'direct');

  // Получение имени собеседника для личного чата
  const getDirectRoomName = (room) => {
    if (room.members) {
      const otherId = room.members.find(id => id !== currentUser?.id);
      const otherUser = users.find(u => u.id === otherId);
      return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Личный чат';
    }
    // Если members нет, попробуем найти через API (упрощённо)
    return 'Личный чат';
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const memberIds = selectedUsers.map(u => u.id);
    const result = await dispatch(createRoom({ name: newRoomName, memberIds }));
    if (result.payload?.id) {
      navigate(`/chat/${result.payload.id}`);
    }
    setCreateDialogOpen(false);
    setNewRoomName('');
    setSelectedUsers([]);
  };

  const handleStartDirect = async (user) => {
    const result = await dispatch(createDirectRoom(user.id));
    if (result.payload?.id) {
      navigate(`/chat/${result.payload.id}`);
    }
  };

  const filteredUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', height: '75vh', gap: 2 }}>
        <Paper sx={{ width: 280, p: 1.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
            <Tab label="Группы" />
            <Tab label="Личные" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 1 }}>
            {loadingRooms && <Typography sx={{ p: 1 }}>Загрузка...</Typography>}
            {!loadingRooms && tab === 0 && (
              <>
                {groupRooms.length === 0 ? (
                  <Typography sx={{ p: 1 }} color="text.secondary">Нет групп</Typography>
                ) : (
                  <List dense>
                    {groupRooms.map(room => (
                      <ListItemButton
                        key={room.id}
                        selected={room.id === roomId}
                        onClick={() => navigate(`/chat/${room.id}`)}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                      >
                        <ListItemText primary={room.name || 'Без названия'} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Создать комнату
                </Button>
              </>
            )}
            {!loadingRooms && tab === 1 && (
              <List dense>
                {filteredUsers.map(user => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleStartDirect(user)}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                  >
                    <Avatar sx={{ width: 24, height: 24, mr: 1 }}>{user.firstName?.[0]}</Avatar>
                    <ListItemText primary={`${user.firstName} ${user.lastName}`} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        <Box flexGrow={1}>
          {roomId ? <ChatWindow roomId={roomId} /> : <Typography color="text.secondary">Выберите чат</Typography>}
        </Box>
      </Box>

      {/* Модальное окно создания комнаты */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новая комната</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название комнаты"
            fullWidth
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            multiple
            options={filteredUsers}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            value={selectedUsers}
            onChange={(event, newValue) => setSelectedUsers(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Пригласить участников" placeholder="Выберите..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  avatar={<Avatar>{option.firstName?.[0]}</Avatar>}
                  label={`${option.firstName} ${option.lastName}`}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!newRoomName.trim() || selectedUsers.length === 0}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}