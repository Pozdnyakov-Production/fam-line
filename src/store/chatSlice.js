import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

export const fetchRooms = createAsyncThunk('chat/fetchRooms', async () => {
  const { data } = await client.get('/chat/rooms');
  return data;
});

export const createRoom = createAsyncThunk('chat/createRoom', async ({ name, memberIds }) => {
  const { data } = await client.post('/chat/rooms', { name, memberIds });
  return data;
});

export const createDirectRoom = createAsyncThunk('chat/createDirectRoom', async (userId) => {
  const { data } = await client.post('/chat/direct', { userId });
  return data;
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (roomId) => {
  const { data } = await client.get(`/chat/messages/${roomId}`);
  return { roomId, messages: data };
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ roomId, text }) => {
  const { data } = await client.post('/chat/messages', { roomId, text });
  return data;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    rooms: [],
    messagesByRoom: {},
    loadingRooms: false,
    loadingMessages: false,
  },
  reducers: {
    // Добавляет полученное через сокет сообщение (чужие сообщения)
    messageReceived(state, action) {
      const msg = action.payload;
      const roomMessages = state.messagesByRoom[msg.roomId] || [];
      // Избегаем дублирования (на всякий случай проверяем id)
      if (!roomMessages.find(m => m.id === msg.id)) {
        state.messagesByRoom[msg.roomId] = [...roomMessages, msg];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => { state.loadingRooms = true; })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.rooms = action.payload;
        state.loadingRooms = false;
      })
      .addCase(fetchRooms.rejected, (state) => { state.loadingRooms = false; })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload);
      })
      .addCase(createDirectRoom.fulfilled, (state, action) => {
        const exists = state.rooms.find(r => r.id === action.payload.id);
        if (!exists) {
          state.rooms.push({ id: action.payload.id, type: 'direct' });
        }
      })
      .addCase(fetchMessages.pending, (state) => { state.loadingMessages = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesByRoom[action.payload.roomId] = action.payload.messages;
        state.loadingMessages = false;
      })
      .addCase(fetchMessages.rejected, (state) => { state.loadingMessages = false; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const roomMessages = state.messagesByRoom[msg.roomId] || [];
        // Добавляем своё сообщение (ответ от сервера)
        if (!roomMessages.find(m => m.id === msg.id)) {
          state.messagesByRoom[msg.roomId] = [...roomMessages, msg];
        }
      });
  },
});

export const { messageReceived } = chatSlice.actions;
export default chatSlice.reducer;