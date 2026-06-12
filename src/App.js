// src/App.js
import React, { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box, Typography } from '@mui/material';
import { getTheme } from './theme';
import MainLayout from './components/layout/MainLayout';
import TopBar from './components/layout/TopBar';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import BankPage from './pages/BankPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage';
import OnboardingPage from './pages/OnboardingPage';
import FamilyManagementPage from './pages/FamilyManagementPage';
import { fetchTasks } from './store/tasksSlice';
import { fetchPosts } from './store/postsSlice';
import { fetchNotifications } from './store/notificationsSlice';
import { fetchFamily } from './store/familySlice';
import { fetchNotes } from './store/notesSlice';
import { fetchTransactions } from './store/bonusesSlice';
import { fetchRooms } from './store/chatSlice';
import { fetchFamilyUsers } from './store/authSlice';
import { connectSocket, disconnectSocket } from './services/socket'; // импорт сокета

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const { darkMode, customColors } = useSelector((state) => state.settings);
  const family = useSelector((state) => state.family.currentFamily);
  const familyLoading = useSelector((state) => state.family.loading);
  const token = useSelector((state) => state.auth.token);

  const theme = useMemo(
    () => getTheme(darkMode ? 'dark' : 'light', customColors),
    [darkMode, customColors]
  );

  useEffect(() => {
    if (user) {
      // Инициализируем сокет
      connectSocket();
      if (!family && !familyLoading) {
        dispatch(fetchFamily());
      }
      dispatch(fetchTasks());
      dispatch(fetchPosts());
      dispatch(fetchNotifications());
      dispatch(fetchNotes());
      dispatch(fetchTransactions());
      dispatch(fetchRooms());
      dispatch(fetchFamilyUsers());
    }
    return () => {
      disconnectSocket();
    };
  }, [user, dispatch, token]);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage />
      </ThemeProvider>
    );
  }

  if (isNewUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OnboardingPage />
      </ThemeProvider>
    );
  }

  if (familyLoading && !family) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!family && !familyLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography>Не удалось загрузить семью. Пожалуйста, перезайдите.</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopBar />
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/profile/:userId?" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:roomId" element={<ChatPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/family" element={<FamilyManagementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;