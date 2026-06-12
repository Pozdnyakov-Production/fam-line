import React, { useState } from 'react';
import {
  Container, Paper, Typography, Stepper, Step, StepLabel, Button,
  TextField, Box, Chip, Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { clearNewUser } from '../store/authSlice';
import { createFamily } from '../store/familySlice';
import { addPost } from '../store/postsSlice';
import PostCard from '../components/post/PostCard';

const steps = [
  'Создание семьи',
  'Приглашение участников',
  'Первый пост',
  'Завершение',
];

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [activeStep, setActiveStep] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [postText, setPostText] = useState('');
  const [posted, setPosted] = useState(false);

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleCreateFamily = () => {
    if (!familyName.trim()) return;
    // Отправляем только имя строкой – сервер создаст семью и вернёт объект
    dispatch(createFamily(familyName.trim()));
    handleNext();
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setInvitedMembers([...invitedMembers, newMemberName]);
    setNewMemberName('');
  };

  const handleRemoveMember = (name) => {
    setInvitedMembers(invitedMembers.filter(n => n !== name));
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    dispatch(addPost({
      id: Date.now().toString(),
      authorId: user.id,
      text: postText,
      date: new Date().toISOString(),
      likes: [],
      comments: [],
      reactions: {},
      familyId: null,
    }));
    setPosted(true);
    handleNext();
  };

  const handleFinish = () => dispatch(clearNewUser());

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Добро пожаловать, {user.firstName}!
        </Typography>
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Создайте свою семью</Typography>
            <TextField fullWidth label="Название семьи" value={familyName} onChange={e => setFamilyName(e.target.value)} />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleCreateFamily} disabled={!familyName.trim()}>Создать семью</Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Пригласите членов семьи</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField label="Имя участника" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} size="small" />
              <Button variant="outlined" onClick={handleAddMember} disabled={!newMemberName.trim()}>Добавить</Button>
            </Box>
            {invitedMembers.map(name => (
              <Chip key={name} label={name} onDelete={() => handleRemoveMember(name)} sx={{ m: 0.5 }} />
            ))}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Назад</Button>
              <Button variant="contained" onClick={handleNext}>Продолжить</Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Опубликуйте первый пост</Typography>
            <TextField fullWidth multiline rows={4} placeholder="Что у вас нового?" value={postText} onChange={e => setPostText(e.target.value)} />
            {!posted ? (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>Назад</Button>
                <Button variant="contained" onClick={handlePost} disabled={!postText.trim()}>Опубликовать</Button>
              </Box>
            ) : (
              <>
                <Alert severity="success" sx={{ mt: 2 }}>Пост опубликован!</Alert>
                <Box sx={{ mt: 2 }}>
                  <PostCard post={{ id: 'preview', authorId: user.id, text: postText, date: new Date().toISOString(), likes: [], comments: [], reactions: {} }} />
                </Box>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={handleBack}>Назад</Button>
                  <Button variant="contained" onClick={handleNext}>Дальше</Button>
                </Box>
              </>
            )}
          </Box>
        )}

        {activeStep === 3 && (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>Поздравляем!</Typography>
            <Typography paragraph>Теперь вы полностью готовы. Управляйте задачами, общайтесь в чате, копите бонусы!</Typography>
            <Button variant="contained" size="large" onClick={handleFinish}>Начать пользоваться</Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}