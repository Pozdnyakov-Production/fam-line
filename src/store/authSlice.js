import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';
import { setCurrentFamily } from './familySlice';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/auth/login', credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Ошибка входа');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue, dispatch }) => {
  try {
    const { data } = await client.post('/auth/register', userData);
    if (data.family) {
      dispatch(setCurrentFamily(data.family));
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Ошибка регистрации');
  }
});

export const fetchFamilyUsers = createAsyncThunk('auth/fetchFamilyUsers', async () => {
  const { data } = await client.get('/users/family');
  return data;
});

export const verifyToken = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Ошибка верификации');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isNewUser: false,
    error: null,
    loading: false,
    users: [],
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isNewUser = false;
      state.users = [];
      localStorage.removeItem('token');
    },
    clearError(state) { state.error = null; },
    clearNewUser(state) { state.isNewUser = false; },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isNewUser = false;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isNewUser = false;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchFamilyUsers.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(verifyToken.pending, (state) => { state.loading = true; })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = localStorage.getItem('token');
        state.isNewUser = false;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError, clearNewUser, updateUser } = authSlice.actions;
export default authSlice.reducer;