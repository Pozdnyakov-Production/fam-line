import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Button, Grid, Container, Chip, Card, CardContent, CardActions,
  Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Slide,
  Tabs, Tab, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PreviewIcon from '@mui/icons-material/Preview';
import ReplayIcon from '@mui/icons-material/Replay';
import { changeTaskStatus, fetchTasks, submitTaskResult } from '../store/tasksSlice';
import { STATUS_LABELS } from '../utils/constants';
import TaskModal from '../components/tasks/TaskModal';
import usePermissions from '../hooks/usePermissions';
import client from '../api/client';

const statusColors = {
  pending: '#FFC107',
  accepted: '#2196F3',
  in_progress: '#FF9800',
  in_review: '#9C27B0',
  done: '#4CAF50',
  rejected: '#F44336',
  reopened: '#FF9800',
};

const STATUS_TABS = [
  { label: 'Назначенные', statuses: ['pending'] },
  { label: 'В процессе', statuses: ['accepted', 'in_progress', 'in_review', 'reopened'] },
  { label: 'Завершённые', statuses: ['done'] },
  { label: 'Отменённые', statuses: ['rejected'] },
];

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TasksPage() {
  const dispatch = useDispatch();
  const { canCreateTasks, family, isOwner } = usePermissions();
  const allTasks = useSelector(state => state.tasks.tasks);
  const familyId = family?.id;
  const tasks = allTasks.filter(t => String(t.familyId) === String(familyId));
  const users = useSelector(state => state.auth.users);
  const currentUser = useSelector(state => state.auth.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [resultText, setResultText] = useState('');

  useEffect(() => {
    if (familyId) {
      dispatch(fetchTasks());
    }
  }, [dispatch, familyId]);

  const handleTabChange = (e, newValue) => setActiveTab(newValue);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setResultText(task.result || '');
    setReviewComment('');
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    setReviewComment('');
    setResultText('');
  };

  const getUserById = (id) => users.find(u => String(u.id) === String(id));
  const isAssignee = (task) => String(task.assigneeId) === String(currentUser?.id);
  const isReviewer = (task) => isOwner || String(task.creatorId) === String(currentUser?.id);

  // Функция отправки уведомления
  const sendNotification = async (userId, message) => {
    try {
      await client.post('/notifications', { userId, message });
    } catch (err) {
      console.error('Ошибка отправки уведомления', err);
    }
  };

  // Действия с уведомлениями
  const handleAccept = async (taskId, task) => {
    dispatch(changeTaskStatus({ taskId, newStatus: 'accepted' }));
    const assignee = getUserById(task.assigneeId);
    const creator = getUserById(task.creatorId);
    if (creator && creator.id !== currentUser?.id) {
      await sendNotification(creator.id, `Пользователь ${assignee?.firstName} принял задачу "${task.title}"`);
    }
    if (assignee && assignee.id !== currentUser?.id) {
      await sendNotification(assignee.id, `Вы приняли задачу "${task.title}"`);
    }
  };

  const handleStartWork = async (taskId, task) => {
    dispatch(changeTaskStatus({ taskId, newStatus: 'in_progress' }));
    const assignee = getUserById(task.assigneeId);
    const creator = getUserById(task.creatorId);
    if (creator && creator.id !== currentUser?.id) {
      await sendNotification(creator.id, `Пользователь ${assignee?.firstName} начал работу над задачей "${task.title}"`);
    }
  };

  const handleReject = async (taskId, task) => {
    dispatch(changeTaskStatus({ taskId, newStatus: 'rejected' }));
    const assignee = getUserById(task.assigneeId);
    const creator = getUserById(task.creatorId);
    if (creator && creator.id !== currentUser?.id) {
      await sendNotification(creator.id, `Пользователь ${assignee?.firstName} отклонил задачу "${task.title}"`);
    }
    if (assignee && assignee.id !== currentUser?.id) {
      await sendNotification(assignee.id, `Вы отклонили задачу "${task.title}"`);
    }
  };

  const handleSubmitResult = async () => {
    if (resultText.trim() && selectedTask) {
      dispatch(submitTaskResult({ taskId: selectedTask.id, result: resultText }));
      const assignee = getUserById(selectedTask.assigneeId);
      const creator = getUserById(selectedTask.creatorId);
      if (creator && creator.id !== currentUser?.id) {
        await sendNotification(creator.id, `Пользователь ${assignee?.firstName} отправил результат по задаче "${selectedTask.title}" на проверку`);
      }
      handleCloseTask();
    }
  };

  const handleApprove = async (taskId, task) => {
    dispatch(changeTaskStatus({ taskId, newStatus: 'done' }));
    const assignee = getUserById(task.assigneeId);
    const creator = getUserById(task.creatorId);
    if (assignee && assignee.id !== currentUser?.id) {
      await sendNotification(assignee.id, `Проверяющий подтвердил выполнение задачи "${task.title}"`);
    }
  };

  const handleReopen = async (taskId, task) => {
    if (reviewComment.trim()) {
      dispatch(changeTaskStatus({ taskId, newStatus: 'reopened', reviewComment }));
      const assignee = getUserById(task.assigneeId);
      if (assignee && assignee.id !== currentUser?.id) {
        await sendNotification(assignee.id, `Задача "${task.title}" отправлена на доработку. Комментарий: ${reviewComment}`);
      }
      handleCloseTask();
    }
  };

  const filteredTasks = tasks.filter(task => {
    const currentStatuses = STATUS_TABS[activeTab]?.statuses || [];
    return currentStatuses.includes(task.status);
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Задачи</Typography>
        {canCreateTasks && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)} size="medium">
            Назначить задачу
          </Button>
        )}
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        {STATUS_TABS.map((tab, index) => (
          <Tab key={index} label={tab.label} />
        ))}
      </Tabs>

      {filteredTasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          В этой категории пока нет задач
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map(task => {
            const assigneeUser = getUserById(task.assigneeId);
            const isCurrentAssignee = isAssignee(task);
            const isCurrentReviewer = isReviewer(task);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={task.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderTop: `4px solid ${statusColors[task.status] || '#ccc'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={() => handleOpenTask(task)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={STATUS_LABELS[task.status] || task.status}
                        size="small"
                        sx={{ bgcolor: statusColors[task.status], color: 'white' }}
                      />
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        +{task.bonus} бонусов
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom noWrap sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {task.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 0.5, bgcolor: 'primary.light' }}>
                        {assigneeUser?.firstName?.[0]}
                      </Avatar>
                      <Typography variant="caption">
                        {assigneeUser?.firstName} {assigneeUser?.lastName}
                      </Typography>
                    </Box>
                    {isCurrentAssignee && task.status === 'pending' && (
                      <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" color="success" onClick={() => handleAccept(task.id, task)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleReject(task.id, task)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    {isCurrentAssignee && task.status === 'accepted' && (
                      <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleStartWork(task.id, task); }}>
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    )}
                    {isCurrentAssignee && task.status === 'in_progress' && (
                      <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); handleOpenTask(task); }}>
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    )}
                    {isCurrentReviewer && task.status === 'in_review' && (
                      <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" color="success" onClick={() => handleApprove(task.id, task)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="warning" onClick={() => handleOpenTask(task)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Модальное окно с деталями и действиями */}
      <Dialog
        open={Boolean(selectedTask)}
        onClose={handleCloseTask}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
      >
        {selectedTask && (
          <>
            <DialogTitle>
              {selectedTask.title}
              <Chip
                label={STATUS_LABELS[selectedTask.status] || selectedTask.status}
                size="small"
                sx={{ ml: 2, bgcolor: statusColors[selectedTask.status], color: 'white' }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" paragraph>{selectedTask.description}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Исполнитель: {getUserById(selectedTask.assigneeId)?.firstName} {getUserById(selectedTask.assigneeId)?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Создал: {getUserById(selectedTask.creatorId)?.firstName} {getUserById(selectedTask.creatorId)?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">Бонус: {selectedTask.bonus}</Typography>
              {selectedTask.result && (
                <Typography variant="body2" sx={{ mt: 1 }}>Результат: {selectedTask.result}</Typography>
              )}
              {selectedTask.reviewComment && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>Комментарий: {selectedTask.reviewComment}</Typography>
              )}

              {isAssignee(selectedTask) && (
                <Box sx={{ mt: 2 }}>
                  {selectedTask.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="success" onClick={() => { handleAccept(selectedTask.id, selectedTask); handleCloseTask(); }}>
                        Принять
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => { handleReject(selectedTask.id, selectedTask); handleCloseTask(); }}>
                        Отклонить
                      </Button>
                    </Box>
                  )}
                  {selectedTask.status === 'accepted' && (
                    <Button variant="contained" onClick={() => { handleStartWork(selectedTask.id, selectedTask); handleCloseTask(); }}>
                      Начать работу
                    </Button>
                  )}
                  {selectedTask.status === 'in_progress' && (
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Опишите результат"
                        value={resultText}
                        onChange={e => setResultText(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button variant="contained" onClick={handleSubmitResult} disabled={!resultText.trim()}>
                        Отправить на проверку
                      </Button>
                    </Box>
                  )}
                  {selectedTask.status === 'reopened' && (
                    <Button variant="contained" onClick={() => { handleStartWork(selectedTask.id, selectedTask); handleCloseTask(); }}>
                      Продолжить работу
                    </Button>
                  )}
                </Box>
              )}

              {isReviewer(selectedTask) && selectedTask.status === 'in_review' && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button variant="contained" color="success" onClick={() => { handleApprove(selectedTask.id, selectedTask); handleCloseTask(); }}>
                      Подтвердить
                    </Button>
                    <Button variant="outlined" color="warning" onClick={() => { if (reviewComment.trim()) handleReopen(selectedTask.id, selectedTask); }}>
                      Доработать
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Комментарий (при доработке)"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleReopen(selectedTask.id, selectedTask)}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseTask}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Container>
  );
}