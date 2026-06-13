import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Grid, IconButton, Divider,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setCustomColors } from '../../store/settingsSlice';

const PRIMARY_COLORS = [
  '#6C63FF', '#4A76A8', '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#607D8B',
];
const SECONDARY_COLORS = [
  '#FF6584', '#FF4081', '#FF5722', '#8BC34A', '#03A9F4', '#FFC107', '#673AB7', '#795548',
];

function ColorPicker({ label, colors, selected, onChange }) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Grid container spacing={1}>
        {colors.map((color) => (
          <Grid item key={color}>
            <IconButton
              onClick={() => onChange(color)}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: color,
                border: selected === color ? '3px solid #fff' : '3px solid transparent',
                boxShadow: selected === color ? `0 0 0 2px ${color}` : '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function ColorSchemeModal({ open, onClose }) {
  const dispatch = useDispatch();
  const currentSettings = useSelector(state => state.settings);
  const { darkMode, customColors } = currentSettings;

  const [primaryColor, setPrimaryColor] = useState(customColors?.primary || '');
  const [secondaryColor, setSecondaryColor] = useState(customColors?.secondary || '');
  const [previewMode] = useState(darkMode); // для превью можно менять, но оставим текущий

  useEffect(() => {
    setPrimaryColor(customColors?.primary || '');
    setSecondaryColor(customColors?.secondary || '');
  }, [customColors, open]);

  const handleSave = () => {
    dispatch(setCustomColors({ primary: primaryColor, secondary: secondaryColor }));
    onClose();
  };

  // Превью: маленький блок, имитирующий меню и кнопки
  const Preview = () => {
    const bg = previewMode ? '#121212' : '#EDEEF0';
    const paper = previewMode ? '#232324' : '#FFFFFF';
    const text = previewMode ? '#E1E1E1' : '#000';
    const pri = primaryColor || (previewMode ? '#6A8DB5' : '#4A76A8');
    const sec = secondaryColor || (previewMode ? '#8DA6CE' : '#7A9BCB');

    return (
      <Box sx={{ bgcolor: bg, p: 2, borderRadius: 2, mb: 2 }}>
        <Box sx={{ bgcolor: paper, p: 1, borderRadius: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, bgcolor: pri, borderRadius: '50%' }} />
          <Typography variant="body2" color={text}>Меню</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ flex: 1, height: 20, bgcolor: pri, borderRadius: 1 }} />
          <Box sx={{ flex: 1, height: 20, bgcolor: sec, borderRadius: 1 }} />
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Цветовая схема</DialogTitle>
      <DialogContent>
        <Preview />
        <ColorPicker
          label="Основной цвет"
          colors={PRIMARY_COLORS}
          selected={primaryColor}
          onChange={setPrimaryColor}
        />
        <Divider sx={{ my: 2 }} />
        <ColorPicker
          label="Акцентный цвет"
          colors={SECONDARY_COLORS}
          selected={secondaryColor}
          onChange={setSecondaryColor}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
}