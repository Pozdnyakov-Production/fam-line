import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ru from 'date-fns/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Typography, TextField, Button, IconButton, List, ListItem, ListItemText, Container, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { addNote, deleteNote } from '../store/notesSlice';

const locales = { ru };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ru }), getDay, locales });

export default function CalendarPage() {
  const dispatch = useDispatch();
  const notes = useSelector(state => state.notes.notes);
  const user = useSelector(state => state.auth.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newNoteText, setNewNoteText] = useState('');

  const myNotes = notes.filter(n => n.userId === user.id);
  const events = myNotes.map(n => ({ title: n.text, start: new Date(n.date), end: new Date(n.date), id: n.id }));

  const handleSelectSlot = ({ start }) => setSelectedDate(start);
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    dispatch(addNote({ userId: user.id, date: selectedDate.toISOString(), text: newNoteText }));
    setNewNoteText('');
  };

  const notesForDate = myNotes.filter(n => new Date(n.date).toDateString() === selectedDate.toDateString());

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" mb={3}>Календарь заметок</Typography>
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          selectable
          onSelectSlot={handleSelectSlot}
          views={['month']}
          culture="ru"
          messages={{ today: 'Сегодня', previous: 'Назад', next: 'Вперед', month: 'Месяц' }}
        />
      </Paper>
      <Typography variant="h6" mb={2}>
        Заметки на {format(selectedDate, 'dd.MM.yyyy')}
      </Typography>
      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <List>
          {notesForDate.map(note => (
            <ListItem key={note.id} secondaryAction={
              <IconButton edge="end" onClick={() => dispatch(deleteNote(note.id))}><DeleteIcon /></IconButton>
            }>
              <ListItemText primary={note.text} />
            </ListItem>
          ))}
        </List>
        <Box display="flex" gap={1} mt={2}>
          <TextField size="small" fullWidth label="Новая заметка" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} />
          <Button variant="contained" onClick={handleAddNote}>Добавить</Button>
        </Box>
      </Paper>
    </Container>
  );
}