import React from 'react';
import { useSelector } from 'react-redux';
import { Grid, Typography, Paper, Box, Avatar, Chip, Container } from '@mui/material';
import PostCard from '../components/post/PostCard';
import { motion } from 'framer-motion';

const BalanceWidget = () => {
  const balance = useSelector(state => state.bonuses.balance);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Paper sx={{
        p: 3, mb: 3, textAlign: 'center',
        background: 'linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%)',
        color: 'white',
        borderRadius: 4,
        boxShadow: '0 20px 40px rgba(108,99,255,0.3)',
      }}>
        <Typography variant="h6" fontWeight={500}>Текущий баланс</Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>{balance} ₽</Typography>
      </Paper>
    </motion.div>
  );
};

const FamilyMembersWidget = () => {
  const family = useSelector(state => state.family.currentFamily);
  const users = useSelector(state => state.auth.users);
  if (!family) return null;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
      <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Семья</Typography>
        {family.members.map((member) => {
          const user = users.find(u => u.id === member.id);
          return (
            <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{user?.firstName?.[0]}</Avatar>
              <Box>
                <Typography variant="body1" fontWeight={600}>{user?.firstName} {user?.lastName}</Typography>
                <Chip label={member.role === 'owner' ? 'Владелец' : member.role === 'parent' ? 'Родитель' : 'Ребёнок'} size="small" variant="outlined" />
              </Box>
            </Box>
          );
        })}
      </Paper>
    </motion.div>
  );
};

const FamilyNewsWidget = () => {
  const posts = useSelector(state => state.posts.posts);
  const familyId = useSelector(state => state.family.currentFamily?.id);
  const familyPosts = posts.filter(p => p.familyId === familyId).slice(-10);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
      <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Лента</Typography>
        {familyPosts.length === 0 ? (
          <Typography color="text.secondary">Пока нет записей</Typography>
        ) : (
          familyPosts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </Paper>
    </motion.div>
  );
};

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Typography variant="h4" fontWeight={700} mb={3}>Главная</Typography>
      </motion.div>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <BalanceWidget />
          <FamilyMembersWidget />
        </Grid>
        <Grid item xs={12} md={8}>
          <FamilyNewsWidget />
        </Grid>
      </Grid>
    </Container>
  );
}