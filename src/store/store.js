import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import familyReducer from './familySlice';
import tasksReducer from './tasksSlice';
import notesReducer from './notesSlice';
import bonusesReducer from './bonusesSlice';
import settingsReducer from './settingsSlice';
import chatReducer from './chatSlice';
import postsReducer from './postsSlice';
import notificationsReducer from './notificationsSlice';
import { setupInterceptors } from '../api/client';

const store = configureStore({
  reducer: {
    auth: authReducer,
    family: familyReducer,
    tasks: tasksReducer,
    notes: notesReducer,
    bonuses: bonusesReducer,
    settings: settingsReducer,
    chat: chatReducer,
    posts: postsReducer,
    notifications: notificationsReducer,
  },
});

setupInterceptors(store, logout);

export default store;