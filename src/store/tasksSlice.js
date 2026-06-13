import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

export const fetchTasks = createAsyncThunk('tasks/fetch', async () => {
  const { data } = await client.get('/tasks');
  return data;
});

export const addTask = createAsyncThunk('tasks/add', async (task) => {
  const { data } = await client.post('/tasks', task);
  return data;
});

export const changeTaskStatus = createAsyncThunk(
  'tasks/changeStatus',
  async ({ taskId, newStatus, reviewComment }) => {
    await client.put(`/tasks/${taskId}/status`, { status: newStatus, reviewComment });
    // Сервер сам отправит событие через сокет, поэтому мы просто возвращаем результат.
    return { taskId, newStatus, reviewComment };
  }
);

export const submitTaskResult = createAsyncThunk(
  'tasks/submitResult',
  async ({ taskId, result }) => {
    await client.put(`/tasks/${taskId}/result`, { result });
    return { taskId, result, status: 'in_review' };
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { tasks: [], loading: false },
  reducers: {
    addTaskAction(state, action) {
      state.tasks.push(action.payload);
    },
    changeTaskStatusAction(state, action) {
      const { taskId, newStatus, reviewComment } = action.payload;
      const task = state.tasks.find(t => String(t.id) === String(taskId));
      if (task) {
        task.status = newStatus;
        if (reviewComment !== undefined) {
          task.reviewComment = reviewComment;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.loading = false;
      })
      .addCase(fetchTasks.rejected, (state) => { state.loading = false; })
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(changeTaskStatus.fulfilled, (state, action) => {
        const { taskId, newStatus, reviewComment } = action.payload;
        const task = state.tasks.find(t => String(t.id) === String(taskId));
        if (task) {
          task.status = newStatus;
          if (reviewComment !== undefined) {
            task.reviewComment = reviewComment;
          }
        }
      })
      .addCase(submitTaskResult.fulfilled, (state, action) => {
        const { taskId, result, status } = action.payload;
        const task = state.tasks.find(t => String(t.id) === String(taskId));
        if (task) {
          task.result = result;
          task.status = status;
        }
      });
  },
});

export const { addTaskAction, changeTaskStatusAction } = tasksSlice.actions;
export default tasksSlice.reducer;