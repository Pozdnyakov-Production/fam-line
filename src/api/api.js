import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// Families
export const createFamily = (data) => API.post('/families', data);
export const getFamilies = () => API.get('/families');

// Tasks
export const getTasks = (familyId) => API.get(`/tasks/${familyId}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTaskStatus = (taskId, status) => API.patch(`/tasks/${taskId}`, { status });

// Posts
export const getPosts = (familyId) => API.get(`/posts/${familyId}`);
export const createPost = (data) => API.post('/posts', data);
export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const commentPost = (postId, text) => API.post(`/posts/${postId}/comment`, { text });

// Settings
export const getUserSettings = () => API.get('/settings');
export const saveSettings = (data) => API.put('/settings', data);