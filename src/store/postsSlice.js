import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

export const fetchPosts = createAsyncThunk('posts/fetch', async () => {
  const { data } = await client.get('/posts');
  return data;
});

export const addPost = createAsyncThunk('posts/add', async (post) => {
  const { data } = await client.post('/posts', post);
  return data;
});

export const deletePost = createAsyncThunk('posts/delete', async (id) => {
  await client.delete(`/posts/${id}`);
  return id;
});

export const toggleLike = createAsyncThunk('posts/toggleLike', async (postId, { getState }) => {
  const user = getState().auth.user;
  if (!user) return;
  await client.post(`/posts/${postId}/like`);
  return { postId, userId: user.id };
});

export const addComment = createAsyncThunk('posts/addComment', async ({ postId, text }) => {
  const { data } = await client.post(`/posts/${postId}/comment`, { text });
  return { postId, comment: data };
});

export const addReaction = createAsyncThunk('posts/addReaction', async ({ postId, reaction }, { getState }) => {
  const user = getState().auth.user;
  if (!user) return;
  await client.post(`/posts/${postId}/reaction`, { reaction });
  return { postId, reaction, userId: user.id };
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.posts.push(action.payload);
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p.id !== action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { postId, userId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
          } else {
            post.likes.push(userId);
          }
        }
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p.id === action.payload.postId);
        if (post) {
          post.comments.push(action.payload.comment);
        }
      })
      .addCase(addReaction.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { postId, reaction, userId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          if (!post.reactions) post.reactions = {};
          post.reactions[userId] = reaction;
        }
      });
  },
});

export default postsSlice.reducer;