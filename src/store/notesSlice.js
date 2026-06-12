import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

// Получить все заметки текущего пользователя
export const fetchNotes = createAsyncThunk('notes/fetch', async () => {
  const { data } = await client.get('/notes');
  return data;
});

// Создать заметку (поля date, text)
export const addNote = createAsyncThunk('notes/add', async (note) => {
  const { data } = await client.post('/notes', note);
  return data; // { id, userId, date, text }
});

// Удалить заметку
export const deleteNote = createAsyncThunk('notes/delete', async (id) => {
  await client.delete(`/notes/${id}`);
  return id;
});

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.notes = action.payload;
        state.loading = false;
      })
      .addCase(fetchNotes.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.notes.push(action.payload);
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter((n) => n.id !== action.payload);
      });
  },
});

export default notesSlice.reducer;