import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Switch, FormControlLabel, Paper, Container,
  TextField, Button, Alert, FormGroup,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode, toggleMenuItem } from '../store/settingsSlice';
import { updateUser } from '../store/authSlice';
import client from '../api/client';

const menuItems = [
  { id: 'home', label: 'Главная' },
  { id: 'family', label: 'Семья' },
  { id: 'tasks', label: 'Задачи' },
  { id: 'chat', label: 'Сообщения' },
  { id: 'bank', label: 'Банк' },
  { id: 'search', label: 'Поиск' },
  { id: 'calendar', label: 'Календарь' },
];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { darkMode, visibleMenuItems } = useSelector(state => state.settings);
  const user = useSelector(state => state.auth.user);

  const [tabValue, setTabValue] = useState(0);
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleSavePhone = async () => {
    try {
      await client.put('/user/phone', { phone });
      dispatch(updateUser({ phone }));
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Ошибка сохранения номера');
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess('');
    const { newPassword, confirm } = passwordForm;

    if (newPassword.length < 4) {
      setPasswordError('Новый пароль должен содержать минимум 4 символа');
      return;
    }
    if (newPassword !== confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    // Здесь должна быть отправка на сервер, но пока оставим локально
    dispatch(updateUser({ ...user, password: newPassword }));
    setPasswordSuccess('Пароль успешно изменён');
    setPasswordForm({ newPassword: '', confirm: '' });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Настройки</Typography>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 0 0 1px #dce1e6', mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Аккаунт и внешний вид" />
          <Tab label="Безопасность" />
          <Tab label="Уведомления" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Тема</Typography>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => dispatch(toggleDarkMode())} />}
                label="Тёмная тема"
                sx={{ mb: 3 }}
              />

              <Typography variant="h6" gutterBottom>Номер телефона</Typography>
              <Box display="flex" gap={2} mb={3}>
                <TextField
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7..."
                  size="small"
                />
                <Button variant="outlined" onClick={handleSavePhone}>Сохранить</Button>
                {phoneSaved && <Alert severity="success" sx={{ mt: 1 }}>Номер сохранён</Alert>}
              </Box>

              <Typography variant="h6" gutterBottom>Пункты меню</Typography>
              <FormGroup>
                {menuItems.map(item => (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Switch
                        checked={visibleMenuItems[item.id] !== false}
                        onChange={() => dispatch(toggleMenuItem(item.id))}
                      />
                    }
                    label={item.label}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Сменить пароль</Typography>
              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
              {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
              <TextField fullWidth margin="normal" type="password" label="Новый пароль" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <TextField fullWidth margin="normal" type="password" label="Подтвердите новый пароль" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
              <Button variant="contained" sx={{ mt: 2 }} onClick={handleChangePassword}>Сохранить пароль</Button>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Уведомления</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Настройка уведомлений пока недоступна.
              </Typography>
              <FormControlLabel disabled control={<Switch />} label="Новые задачи" />
              <FormControlLabel disabled control={<Switch />} label="Сообщения в чате" />
              <FormControlLabel disabled control={<Switch />} label="Посты в ленте" />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}