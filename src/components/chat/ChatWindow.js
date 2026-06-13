import React, { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, IconButton, List, ListItem, Typography, Paper, CircularProgress, Avatar,
  useTheme, Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, fetchMessages } from '../../store/chatSlice';
import { fetchFamilyUsers } from '../../store/authSlice';

const formatMessageDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit' };
  if (date.toDateString() !== now.toDateString()) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], options)}`;
  }
  return date.toLocaleTimeString([], options);
};

export default function ChatWindow({ roomId }) {
  const [text, setText] = useState('');
  const [accessError, setAccessError] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  const messagesByRoom = useSelector(state => state.chat.messagesByRoom);
  const loadingMessages = useSelector(state => state.chat.loadingMessages);
  const user = useSelector(state => state.auth.user);
  const users = useSelector(state => state.auth.users);
  const rooms = useSelector(state => state.chat.rooms);
  const room = rooms.find(r => r.id === roomId);

  useEffect(() => {
    if (users.length === 0) dispatch(fetchFamilyUsers());
  }, [dispatch, users.length]);

  useEffect(() => {
    if (roomId) {
      dispatch(fetchMessages(roomId));
      // Проверяем, состоит ли текущий пользователь в комнате
      if (room && room.members) {
        if (!room.members.includes(user?.id)) {
          setAccessError(true);
        } else {
          setAccessError(false);
        }
      } else if (room && !room.members) {
        // Если у комнаты нет members, считаем, что доступ есть (семейная или старая)
        setAccessError(false);
      }
    }
  }, [dispatch, roomId, room, user?.id]);

  const messages = messagesByRoom[roomId] || [];
  const roomMessages = [...messages].sort((a, b) => new Date(a.date) - new Date(b.date));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const handleSend = () => {
    if (!text.trim() || accessError) return;
    dispatch(sendMessage({ roomId, text }));
    setText('');
  };

  const getUserById = (id) => users.find(u => String(u.id) === String(id));

  let headerTitle = room?.name || 'Чат';
  if (room?.type === 'direct') {
    const otherUserId = room.members?.find(id => id !== user?.id);
    const otherUser = otherUserId ? getUserById(otherUserId) : null;
    headerTitle = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Личный чат';
  }

  if (accessError) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 3 }}>
        <Alert severity="error">У вас нет доступа к этой комнате</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
        {headerTitle}
      </Typography>

      {loadingMessages ? (
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
          {roomMessages.map((msg) => {
            const sender = getUserById(msg.userId);
            const isOwn = String(msg.userId) === String(user?.id);
            return (
              <ListItem
                key={msg.id}
                sx={{
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  p: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', maxWidth: '80%' }}>
                  <Avatar sx={{ width: 28, height: 28, mr: isOwn ? 0 : 1, ml: isOwn ? 1 : 0 }}>
                    {sender?.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isOwn ? 'right' : 'left' }}>
                      {sender?.firstName} {sender?.lastName}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: isOwn ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200'),
                        color: isOwn ? theme.palette.primary.contrastText : 'text.primary',
                        p: 1.5,
                        borderRadius: 2,
                        borderTopRightRadius: isOwn ? 0 : 16,
                        borderTopLeftRadius: isOwn ? 16 : 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.3 }}>
                      {formatMessageDate(msg.date)}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
          <div ref={messagesEndRef} />
        </List>
      )}

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Сообщение..."
          variant="outlined"
          sx={{ borderRadius: 4 }}
          disabled={accessError}
        />
        <IconButton color="primary" onClick={handleSend} disabled={accessError}><SendIcon /></IconButton>
      </Box>
    </Paper>
  );
}