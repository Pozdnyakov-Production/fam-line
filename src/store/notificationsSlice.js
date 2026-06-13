import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const { data } = await client.get('/notifications');
  return data;
});

export const markAllRead = createAsyncThunk('notifications/markRead', async () => {
  await client.put('/notifications/read-all');
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    addNotification(state, action) {
      state.items.unshift(action.payload);
      if (!action.payload.is_read) state.unread += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unread = action.payload.filter(n => !n.is_read).length;
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => { n.is_read = true; });
        state.unread = 0;
      });
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;