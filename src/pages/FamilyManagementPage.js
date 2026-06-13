import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Tabs, Tab, Box, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, IconButton, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, CircularProgress,
  Switch, FormControlLabel, Divider, Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchFamily, updateFamilyName, updateMemberRole, removeMember, addChild,
} from '../store/familySlice';
import { fetchFamilyUsers } from '../store/authSlice';
import usePermissions from '../hooks/usePermissions';

const ROLE_LABELS = {
  owner: 'Владелец',
  parent: 'Родитель',
  grandparent: 'Бабушка/дедушка',
  aunt_uncle: 'Тётя/дядя',
  child: 'Ребёнок',
};

// Начальные права участников (можно вынести в отдельный slice, но пока локально)
const DEFAULT_PERMISSIONS = {
  createTasks: false,
  manageBank: false,
  inviteMembers: false,
  editRoles: false,
};

export default function FamilyManagementPage() {
  const dispatch = useDispatch();
  const { isOwner, member: currentMember } = usePermissions();
  const family = useSelector((state) => state.family.currentFamily);
  const loading = useSelector((state) => state.family.loading);
  const users = useSelector((state) => state.auth.users);

  const [tab, setTab] = useState(0);
  const [familyNameInput, setFamilyNameInput] = useState(family?.name || '');
  const [editName, setEditName] = useState(false);
  const [childForm, setChildForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [tempPassword, setTempPassword] = useState('');
  const [roleDialog, setRoleDialog] = useState({ open: false, userId: null, currentRole: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
  // Локальное состояние прав участников
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    dispatch(fetchFamily());
    dispatch(fetchFamilyUsers());
  }, [dispatch]);

  useEffect(() => {
    if (family?.name) setFamilyNameInput(family.name);
  }, [family?.name]);

  useEffect(() => {
    // Инициализируем права для каждого участника
    if (family?.members) {
      const initialPerms = {};
      family.members.forEach(m => {
        initialPerms[m.id] = { ...DEFAULT_PERMISSIONS };
      });
      setPermissions(prev => ({ ...initialPerms, ...prev }));
    }
  }, [family]);

  const handleTabChange = (e, v) => setTab(v);

  const handleSaveName = () => {
    if (familyNameInput.trim()) {
      dispatch(updateFamilyName(familyNameInput.trim()));
      setEditName(false);
    }
  };

  const handleAddChild = async () => {
    try {
      const result = await dispatch(addChild(childForm)).unwrap();
      setTempPassword(`Логин: ${result.username}, временный пароль: ${result.tempPassword}`);
      setChildForm({ firstName: '', lastName: '', phone: '' });
      dispatch(fetchFamily());
      dispatch(fetchFamilyUsers());
    } catch (err) {
      alert(err?.message || 'Ошибка при добавлении ребёнка');
    }
  };

  const handleRoleChange = () => {
    if (roleDialog.userId && roleDialog.currentRole) {
      dispatch(updateMemberRole({ userId: roleDialog.userId, role: roleDialog.currentRole }));
      setRoleDialog({ open: false });
      dispatch(fetchFamily());
      dispatch(fetchFamilyUsers());
    }
  };

  const confirmDelete = (userId) => setDeleteDialog({ open: true, userId });
  const handleDelete = () => {
    if (deleteDialog.userId) {
      dispatch(removeMember(deleteDialog.userId));
      dispatch(fetchFamily());
      dispatch(fetchFamilyUsers());
      setDeleteDialog({ open: false });
    }
  };

  const togglePermission = (userId, key) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: !prev[userId]?.[key],
      },
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Загрузка семьи...</Typography>
      </Container>
    );
  }

  if (!family) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Вы не состоите в семье. Создайте семью или попросите владельца добавить вас.
        </Alert>
      </Container>
    );
  }

  const members = family?.members || [];
  const isAdmin = isOwner || currentMember?.role === 'parent';

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Семья</Typography>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Участники" />
          <Tab label="Добавить ребёнка" />
          {isAdmin && <Tab label="Полномочия" />}
          <Tab label="Настройки" disabled={!isOwner} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <List>
              {members.map(member => {
                const user = users.find(u => u.id === member.id);
                return (
                  <ListItem
                    key={member.id}
                    secondaryAction={
                      isOwner && member.role !== 'owner' ? (
                        <>
                          <Tooltip title="Изменить роль">
                            <IconButton edge="end" onClick={() => setRoleDialog({ open: true, userId: member.id, currentRole: member.role })}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton edge="end" onClick={() => confirmDelete(member.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>{user?.firstName?.[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user?.firstName || ''} ${user?.lastName || ''}`}
                      secondary={ROLE_LABELS[member.role] || member.role}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Добавить ребёнка</Typography>
              <TextField label="Имя" fullWidth margin="normal" value={childForm.firstName} onChange={e => setChildForm({ ...childForm, firstName: e.target.value })} />
              <TextField label="Фамилия" fullWidth margin="normal" value={childForm.lastName} onChange={e => setChildForm({ ...childForm, lastName: e.target.value })} />
              <TextField label="Номер телефона" fullWidth margin="normal" value={childForm.phone} onChange={e => setChildForm({ ...childForm, phone: e.target.value })} />
              <Button variant="contained" sx={{ mt: 2 }} onClick={handleAddChild} startIcon={<PersonAddIcon />}>Создать учётную запись</Button>
              {tempPassword && <Alert severity="success" sx={{ mt: 2 }}>{tempPassword}</Alert>}
            </Box>
          )}

          {tab === 2 && isAdmin && (
            <Box>
              <Typography variant="h6" gutterBottom>Управление полномочиями</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Настройте, какие действия разрешены каждому участнику семьи.
              </Typography>
              {members.map(member => {
                const user = users.find(u => u.id === member.id);
                const memberPerms = permissions[member.id] || DEFAULT_PERMISSIONS;
                return (
                  <Paper key={member.id} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ mr: 1 }}>{user?.firstName?.[0]}</Avatar>
                      <Typography variant="subtitle1">
                        {user?.firstName} {user?.lastName} ({ROLE_LABELS[member.role]})
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={memberPerms.createTasks}
                              onChange={() => togglePermission(member.id, 'createTasks')}
                              disabled={member.role === 'owner'}
                            />
                          }
                          label="Создание задач"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={memberPerms.manageBank}
                              onChange={() => togglePermission(member.id, 'manageBank')}
                              disabled={member.role === 'owner'}
                            />
                          }
                          label="Управление банком"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={memberPerms.inviteMembers}
                              onChange={() => togglePermission(member.id, 'inviteMembers')}
                              disabled={member.role === 'owner'}
                            />
                          }
                          label="Приглашение участников"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={memberPerms.editRoles}
                              onChange={() => togglePermission(member.id, 'editRoles')}
                              disabled={member.role === 'owner'}
                            />
                          }
                          label="Изменение ролей"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => alert('Настройки полномочий сохранены (локально).')}>
                Сохранить настройки
              </Button>
            </Box>
          )}

          {tab === 3 && isOwner && (
            <Box>
              <Typography variant="h6" gutterBottom>Название семьи</Typography>
              {editName ? (
                <Box display="flex" gap={2} alignItems="center">
                  <TextField value={familyNameInput} onChange={e => setFamilyNameInput(e.target.value)} size="small" />
                  <Button variant="contained" onClick={handleSaveName}>Сохранить</Button>
                  <Button onClick={() => setEditName(false)}>Отмена</Button>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">{family?.name}</Typography>
                  <IconButton onClick={() => setEditName(true)}><EditIcon /></IconButton>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Диалоги */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false })}>
        <DialogTitle>Изменить роль</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={roleDialog.currentRole}
              onChange={e => setRoleDialog({ ...roleDialog, currentRole: e.target.value })}
              label="Роль"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                value !== 'owner' && <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false })}>Отмена</Button>
          <Button onClick={handleRoleChange} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle>Удалить участника?</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить этого участника из семьи?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}