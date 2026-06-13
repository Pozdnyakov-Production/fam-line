import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { useDispatch } from 'react-redux';
import client from '../api/client';

export default function ChangePasswordPage() {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleChange = async () => {
    if (newPass !== confirm) return setError('Пароли не совпадают');
    if (newPass.length < 4) return setError('Минимум 4 символа');
    try {
      await client.post('/auth/change-temp-password', { newPassword: newPass });
      window.location.reload(); // перезагружаем приложение, чтобы обновился state
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка смены пароля');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>Смена временного пароля</Typography>
        <Typography variant="body2" mb={3}>При первом входе необходимо задать новый пароль.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Новый пароль"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Подтверждение"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleChange}>
          Сменить пароль
        </Button>
      </Paper>
    </Container>
  );
}