// src/services/socket.js
import { io } from 'socket.io-client';
import store from '../store/store';
import { addTask, changeTaskStatus } from '../store/tasksSlice';
import { messageReceived } from '../store/chatSlice';
import { addNotification } from '../store/notificationsSlice';
import { fetchTransactions } from '../store/bonusesSlice';
import { fetchTasks } from '../store/tasksSlice';

let socket;

export const connectSocket = () => {
  const token = store.getState().auth.token;
  if (!token) return;

  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('Socket.IO подключён');
    socket.emit('join:family');
  });

  socket.on('task:created', (task) => {
    store.dispatch(addTask(task));
  });

  socket.on('task:statusChanged', ({ taskId, newStatus, reviewComment }) => {
    store.dispatch(changeTaskStatus({ taskId, newStatus, reviewComment }));
    store.dispatch(fetchTasks());
  });

  socket.on('task:resultSubmitted', () => {
    store.dispatch(fetchTasks());
  });

  socket.on('chat:message', (message) => {
    store.dispatch(messageReceived(message));
  });

  socket.on('notification:new', (notification) => {
    store.dispatch(addNotification(notification));
  });

  socket.on('bonus:updated', () => {
    store.dispatch(fetchTransactions());
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO отключён:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Ошибка подключения сокета:', error.message);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const emitTaskCreated = (task) => {
  socket?.emit('task:created', task);
};

export const emitTaskStatusChanged = (data) => {
  socket?.emit('task:statusChanged', data);
};

export const emitChatMessage = (message) => {
  socket?.emit('chat:message', message);
};