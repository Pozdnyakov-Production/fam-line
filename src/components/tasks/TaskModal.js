// src/components/tasks/TaskModal.js
import React from 'react';
import { Modal, Box, TextField, Button, MenuItem, Typography } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, fetchTasks } from '../../store/tasksSlice';
import { addNotification } from '../../store/notificationsSlice';
import usePermissions from '../../hooks/usePermissions';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 3,
};

export default function TaskModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { family, members } = usePermissions();
  const users = useSelector(state => state.auth.users);
  const currentUser = useSelector(state => state.auth.user);

  // Все члены семьи, кроме создателя
  const familyMembers = members
    .filter(m => m.status === 'approved')
    .map(m => users.find(u => u.id === m.id))
    .filter(Boolean);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={2}>Новая задача</Typography>
        <Formik
          initialValues={{ assigneeId: '', title: '', description: '', bonus: 0, deadline: '' }}
          validationSchema={Yup.object({
            assigneeId: Yup.string().required('Выберите исполнителя'),
            title: Yup.string().required('Обязательно'),
            bonus: Yup.number().min(0),
          })}
          onSubmit={(values, { resetForm }) => {
            // deadline преобразуем в null, если пусто
            const deadline = values.deadline ? values.deadline : null;
            dispatch(addTask({
              id: Date.now().toString(),
              ...values,
              deadline,
              creatorId: currentUser.id,
              familyId: family.id,
              status: 'pending',
              createdAt: new Date().toISOString(),
            })).then(() => {
              // Уведомление исполнителю
              const assignee = users.find(u => u.id === values.assigneeId);
              if (assignee) {
                dispatch(addNotification({
                  id: Date.now().toString(),
                  userId: assignee.id,
                  message: `${currentUser.firstName} ${currentUser.lastName} назначил вам задачу "${values.title}"`,
                  date: new Date().toISOString(),
                  read: false,
                }));
              }
              dispatch(fetchTasks());
            });
            resetForm();
            onClose();
          }}
        >
          {({ values, handleChange, errors, touched }) => (
            <Form>
              <TextField
                select
                fullWidth
                margin="normal"
                name="assigneeId"
                label="Исполнитель"
                value={values.assigneeId}
                onChange={handleChange}
                error={touched.assigneeId && !!errors.assigneeId}
                helperText={touched.assigneeId && errors.assigneeId}
              >
                {familyMembers.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role === 'child' ? 'Ребёнок' : u.role})
                  </MenuItem>
                ))}
              </TextField>
              <TextField fullWidth margin="normal" name="title" label="Название" value={values.title} onChange={handleChange} error={touched.title && !!errors.title} helperText={touched.title && errors.title} />
              <TextField fullWidth margin="normal" name="description" label="Описание" multiline rows={3} value={values.description} onChange={handleChange} />
              <TextField fullWidth margin="normal" name="bonus" label="Бонус" type="number" value={values.bonus} onChange={handleChange} />
              <TextField
                fullWidth
                margin="normal"
                name="deadline"
                label="Срок выполнения"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={values.deadline}
                onChange={handleChange}
              />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Назначить</Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
}