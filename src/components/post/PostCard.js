import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardActions,
  Avatar, IconButton, Typography, TextField, Box, Chip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike, addComment, addReaction } from '../../store/postsSlice';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const users = useSelector(state => state.auth.users);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [reactionPicker, setReactionPicker] = useState(false);

  const author = users.find(u => u.id === post.authorId);
  const isLiked = post.likes?.includes(user.id);
  const likeCount = post.likes?.length || 0;

  const handleLike = () => dispatch(toggleLike({ postId: post.id, userId: user.id }));
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    dispatch(addComment({
      postId: post.id,
      comment: { id: Date.now().toString(), userId: user.id, text: commentText, date: new Date().toISOString() },
    }));
    setCommentText('');
  };
  const handleReaction = (reaction) => {
    dispatch(addReaction({ postId: post.id, userId: user.id, reaction }));
    setReactionPicker(false);
  };
  const userReaction = post.reactions?.[user.id];

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
      <CardHeader
        avatar={<Avatar>{author?.firstName?.[0]}</Avatar>}
        title={`${author?.firstName} ${author?.lastName}`}
        subheader={new Date(post.date).toLocaleString()}
      />
      <CardContent>
        <Typography variant="body1">{post.text}</Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <IconButton onClick={handleLike} color={isLiked ? 'error' : 'default'}>
            {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>{likeCount}</Typography>

          <IconButton onClick={() => setShowComments(!showComments)}>
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 1 }}>{post.comments?.length || 0}</Typography>

          <Box sx={{ position: 'relative' }}>
            <IconButton onClick={() => setReactionPicker(!reactionPicker)}>
              <EmojiEmotionsIcon />
            </IconButton>
            {reactionPicker && (
              <Box sx={{ position: 'absolute', bottom: 40, left: 0, display: 'flex', gap: 0.5, bgcolor: 'background.paper', p: 0.5, borderRadius: 2, boxShadow: 2 }}>
                {['👍','❤️','😂','😢','🎉'].map(r => (
                  <IconButton key={r} size="small" onClick={() => handleReaction(r)}>{r}</IconButton>
                ))}
              </Box>
            )}
          </Box>
          {userReaction && <Chip label={userReaction} size="small" sx={{ ml: 1 }} />}
        </Box>
      </CardActions>
      {showComments && (
        <Box sx={{ px: 2, pb: 1 }}>
          {post.comments?.map(c => {
            const commentUser = users.find(u => u.id === c.userId);
            return (
              <Box key={c.id} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">{commentUser?.firstName}:</Typography>
                <Typography variant="body2">{c.text}</Typography>
              </Box>
            );
          })}
          <Box sx={{ display: 'flex', mt: 1 }}>
            <TextField size="small" fullWidth placeholder="Написать комментарий…" value={commentText} onChange={e => setCommentText(e.target.value)} />
            <IconButton onClick={handleAddComment}><SendIcon /></IconButton>
          </Box>
        </Box>
      )}
    </Card>
  );
}