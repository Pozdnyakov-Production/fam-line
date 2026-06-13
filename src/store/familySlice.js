import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

export const fetchFamily = createAsyncThunk('family/fetch', async () => {
  const { data } = await client.get('/family/current');
  return data;
});

export const createFamily = createAsyncThunk('family/create', async (name) => {
  const { data } = await client.post('/family/create', { name });
  return data;
});

export const updateFamilyName = createAsyncThunk('family/updateName', async (name) => {
  await client.put('/family/name', { name });
  return name;
});

export const updateMemberRole = createAsyncThunk('family/updateMemberRole', async ({ userId, role }) => {
  await client.put(`/family/member/${userId}`, { role });
  return { userId, role };
});

export const removeMember = createAsyncThunk('family/removeMember', async (userId) => {
  await client.delete(`/family/member/${userId}`);
  return userId;
});

export const addChild = createAsyncThunk('family/addChild', async (childData, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/family/add-child', childData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Ошибка при добавлении ребёнка');
  }
});

const familySlice = createSlice({
  name: 'family',
  initialState: {
    currentFamily: null,
    loading: false,
  },
  reducers: {
    setCurrentFamily(state, action) {
      state.currentFamily = action.payload;
    },
    toggleBank(state) {
      if (state.currentFamily) {
        state.currentFamily.is_bank_open = !state.currentFamily.is_bank_open;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFamily.pending, (state) => { state.loading = true; })
      .addCase(fetchFamily.fulfilled, (state, action) => {
        state.currentFamily = action.payload;
        state.loading = false;
      })
      .addCase(fetchFamily.rejected, (state) => { state.loading = false; })
      .addCase(createFamily.fulfilled, (state, action) => {
        state.currentFamily = action.payload;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const { userId, role } = action.payload;
        const member = state.currentFamily?.members?.find(m => m.id === userId);
        if (member) member.role = role;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const userId = action.payload;
        if (state.currentFamily) {
          state.currentFamily.members = state.currentFamily.members.filter(m => m.id !== userId);
        }
      })
      .addCase(updateFamilyName.fulfilled, (state, action) => {
        if (state.currentFamily) state.currentFamily.name = action.payload;
      });
  },
});

export const { setCurrentFamily, toggleBank } = familySlice.actions;
export default familySlice.reducer;