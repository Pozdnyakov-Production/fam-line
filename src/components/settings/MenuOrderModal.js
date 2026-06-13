import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemIcon, ListItemText, Box, IconButton,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import HomeIcon from '@mui/icons-material/Home';
import TaskIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { reorderMenu } from '../../store/settingsSlice';

const iconMap = {
  home: <HomeIcon />,
  tasks: <TaskIcon />,
  calendar: <CalendarTodayIcon />,
  bank: <AccountBalanceIcon />,
  profile: <PersonIcon />,
  chat: <ChatIcon />,
  search: <SearchIcon />,
  settings: <SettingsIcon />,
};

const labelMap = {
  home: 'Главная',
  tasks: 'Задачи',
  calendar: 'Календарь',
  bank: 'Банк',
  profile: 'Профиль',
  chat: 'Чат',
  search: 'Поиск',
  settings: 'Настройки',
};

export default function MenuOrderModal({ open, onClose }) {
  const dispatch = useDispatch();
  const currentOrder = useSelector(state => state.settings.menuOrder);
  const [items, setItems] = useState(currentOrder);

  useEffect(() => {
    setItems(currentOrder);
  }, [currentOrder, open]); // сброс при открытии

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
  };

  const handleSave = () => {
    // Диспатчим новый порядок (reorderMenu принимает from/to относительно текущего, но мы просто заменим весь массив)
    // В settingsSlice у нас reorderMenu работает с индексами. Сделаем кастомный экшен или просто передадим items.
    // Проще: создадим setMenuOrder в settingsSlice.
    // Добавим экшен setMenuOrder в слайс (ниже).
    dispatch({ type: 'settings/setMenuOrder', payload: items });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Порядок пунктов меню</DialogTitle>
      <DialogContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="menuOrder">
            {(provided) => (
              <List ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 200 }}>
                {items.map((itemId, index) => (
                  <Draggable key={itemId} draggableId={itemId} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'transparent',
                          borderRadius: 2,
                          mb: 0.5,
                        }}
                        secondaryAction={
                          <IconButton {...provided.dragHandleProps} edge="end">
                            <DragIndicatorIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>{iconMap[itemId]}</ListItemIcon>
                        <ListItemText primary={labelMap[itemId]} />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
}