import React from 'react';
import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ChatIcon from '@mui/icons-material/Chat';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const features = [
  { icon: <FamilyRestroomIcon fontSize="large" />, title: 'Семейное пространство', text: 'Общайтесь, ставьте задачи и растите вместе' },
  { icon: <TaskAltIcon fontSize="large" />, title: 'Умные задачи', text: 'Назначайте задания детям с бонусами за выполнение' },
  { icon: <ChatIcon fontSize="large" />, title: 'Семейный чат', text: 'Всегда на связи в общих и личных беседах' },
  { icon: <AccountBalanceWalletIcon fontSize="large" />, title: 'Банк бонусов', text: 'Копите, тратьте и отслеживайте баланс всей семьи' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 8 }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={8}>
          <Typography variant="h2" fontWeight="bold" color="white" gutterBottom>
            Family Connect
          </Typography>
          <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mb: 4 }}>
            Управляйте семьёй, задачами и бонусами в одном месте
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" sx={{ bgcolor: 'white', color: 'primary.main', px: 5, py: 1.5, borderRadius: 30, fontWeight: 'bold', '&:hover': { bgcolor: 'grey.100' } }} onClick={() => navigate('/auth')}>
              Войти
            </Button>
            <Button variant="outlined" size="large" sx={{ borderColor: 'white', color: 'white', px: 5, py: 1.5, borderRadius: 30, fontWeight: 'bold', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }} onClick={() => navigate('/auth?tab=1')}>
              Регистрация
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {features.map((f, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{f.title}</Typography>
                <Typography color="text.secondary">{f.text}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}