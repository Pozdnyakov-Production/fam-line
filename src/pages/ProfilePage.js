import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Avatar, IconButton, Paper, Container,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateUser } from '../store/authSlice';
import { addPost, deletePost } from '../store/postsSlice';
import PostCard from '../components/post/PostCard';

export default function ProfilePage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);
  const users = useSelector(state => state.auth.users);
  const posts = useSelector(state => state.posts.posts);
  const profileUser = userId ? users.find(u => u.id === userId) : currentUser;
  const isOwnProfile = currentUser?.id === profileUser?.id;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profileUser?.firstName || '',
    lastName: profileUser?.lastName || '',
    phone: profileUser?.phone || '',
    email: profileUser?.email || '',
  });
  const [newPostText, setNewPostText] = useState('');

  const userPosts = posts.filter(p => p.authorId === profileUser?.id);

  const handleSave = () => {
    dispatch(updateUser({ ...profileUser, ...form }));
    setEditing(false);
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    dispatch(addPost({
      id: Date.now().toString(),
      authorId: currentUser.id,
      text: newPostText,
      date: new Date().toISOString(),
      likes: [],
      comments: [],
      reactions: {},
      familyId: null,
    }));
    setNewPostText('');
  };

  const handleDeletePost = (postId) => {
    dispatch(deletePost(postId));
  };

  if (!profileUser) {
    return <Typography>Пользователь не найден</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Avatar sx={{ width: 100, height: 100, fontSize: 40 }}>
          {profileUser.firstName?.[0]}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          {!editing ? (
            <>
              <Typography variant="h4">{profileUser.firstName} {profileUser.lastName}</Typography>
              <Typography color="text.secondary">
                {profileUser.phone || 'Телефон не указан'} • {profileUser.email}
              </Typography>
            </>
          ) : (
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Имя" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              <TextField label="Фамилия" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              <TextField label="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Box>
          )}
        </Box>
        {isOwnProfile && (
          <IconButton onClick={() => editing ? handleSave() : setEditing(!editing)} color="primary">
            {editing ? <SaveIcon /> : <EditIcon />}
          </IconButton>
        )}
      </Paper>

      {isOwnProfile && (
        <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" mb={2}>Новый пост</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Что нового?"
            value={newPostText}
            onChange={e => setNewPostText(e.target.value)}
          />
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleCreatePost} disabled={!newPostText.trim()}>
            Опубликовать
          </Button>
        </Paper>
      )}

      <Typography variant="h5" gutterBottom>Лента</Typography>
      {userPosts.length === 0 ? (
        <Typography color="text.secondary">Нет постов</Typography>
      ) : (
        userPosts.map(post => (
          <Box key={post.id} sx={{ position: 'relative' }}>
            {isOwnProfile && (
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                onClick={() => handleDeletePost(post.id)}
              >
                <DeleteIcon />
              </IconButton>
            )}
            <PostCard post={post} />
          </Box>
        ))
      )}
    </Container>
  );
}