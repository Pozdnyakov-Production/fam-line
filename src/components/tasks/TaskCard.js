import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Button, Box, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PreviewIcon from '@mui/icons-material/Preview';
import UploadIcon from '@mui/icons-material/Upload';
import { useDispatch, useSelector } from 'react-redux';
import { changeTaskStatus, submitTaskResult } from '../../store/tasksSlice';
import usePermissions from '../../hooks/usePermissions';

export default function TaskCard({ task, onStatusChange }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const users = useSelector(state => state.auth.users);
  const { isOwner } = usePermissions();
  const isAssignee = task.assigneeId === user?.id;
  const isReviewer = isOwner || (task.creatorId === user?.id);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [resultText, setResultText] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  const assigneeUser = users.find(u => u.id === task.assigneeId);
  const creatorUser = users.find(u => u.id === task.creatorId);

  const handleAccept = () => {
    dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'accepted' }));
    onStatusChange?.();
  };

  const handleStartWork = () => {
    dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'in_progress' }));
  };

  const handleSubmitForReview = () => {
    if (resultText.trim()) {
      dispatch(submitTaskResult({ taskId: task.id, result: resultText }));
      setResultText('');
      setReviewDialogOpen(false);
    }
  };

  const handleApprove = () => {
    dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'done' }));
  };

  const handleReject = () => {
    if (rejectComment.trim()) {
      dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'reopened', reviewComment: rejectComment }));
      setRejectComment('');
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.light' }}>
            {creatorUser?.firstName?.[0]}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {creatorUser?.firstName} {creatorUser?.lastName}
          </Typography>
          <Chip
            label={assigneeUser ? `${assigneeUser.firstName} ${assigneeUser.lastName}` : 'Не назначен'}
            size="small"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>
        <Typography variant="subtitle2" fontWeight={600}>{task.title}</Typography>
        {task.result && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Результат: {task.result}
          </Typography>
        )}
        {task.reviewComment && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Комментарий проверяющего: {task.reviewComment}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 1 }}>
          <Chip
            label={task.status === 'in_review' ? 'На проверке' : task.status === 'reopened' ? 'На доработке' : task.status}
            size="small"
            color={task.status === 'done' ? 'success' : task.status === 'reopened' ? 'warning' : 'default'}
          />
          <Typography variant="body2" fontWeight={500}>
            +{task.bonus} бонусов
          </Typography>
        </Box>

        {/* Исполнитель: кнопки действий */}
        {isAssignee && task.status === 'pending' && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleAccept}>
              Принять
            </Button>
            <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'rejected' }))}>
              Отклонить
            </Button>
          </Box>
        )}
        {isAssignee && task.status === 'accepted' && (
          <Button size="small" variant="contained" onClick={handleStartWork} sx={{ mt: 1 }}>Начать работу</Button>
        )}
        {isAssignee && task.status === 'in_progress' && (
          <>
            <Button size="small" variant="contained" onClick={() => setReviewDialogOpen(true)} sx={{ mt: 1 }} startIcon={<PreviewIcon />}>
              Отправить результат
            </Button>
            <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
              <DialogTitle>Результат выполнения</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Опишите результат"
                  value={resultText}
                  onChange={e => setResultText(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ mt: 2 }}>
                  Загрузить фото
                  <input type="file" hidden accept="image/*" />
                </Button>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setReviewDialogOpen(false)}>Отмена</Button>
                <Button variant="contained" onClick={handleSubmitForReview}>Отправить</Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        {/* Проверяющий (родитель): кнопки подтверждения/отклонения */}
        {isReviewer && task.status === 'in_review' && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button size="small" variant="contained" color="success" onClick={handleApprove}>
              Подтвердить
            </Button>
            <Button size="small" variant="outlined" color="warning" onClick={() => dispatch(changeTaskStatus({ taskId: task.id, newStatus: 'reopened', reviewComment: '' }))}>
              Доработать
            </Button>
          </Box>
        )}
        {isReviewer && task.status === 'in_review' && (
          <TextField
            fullWidth
            size="small"
            label="Комментарий (при отклонении)"
            value={rejectComment}
            onChange={e => setRejectComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
}