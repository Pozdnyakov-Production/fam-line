import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { TextField, Button, List, ListItem, ListItemText, Typography, Grid, Container, Paper } from '@mui/material';

export default function SearchPage() {
  const [query, setQuery] = useState({ firstName: '', lastName: '', middleName: '', phone: '', email: '', age: '' });
  const [results, setResults] = useState([]);
  const users = useSelector(state => state.auth.users);

  const handleSearch = () => {
    const filtered = users.filter(u => {
      const age = u.birthDate ? Math.floor((new Date() - new Date(u.birthDate)) / 31556952000) : null;
      return (
        (!query.firstName || u.firstName.toLowerCase().includes(query.firstName.toLowerCase())) &&
        (!query.lastName || u.lastName.toLowerCase().includes(query.lastName.toLowerCase())) &&
        (!query.middleName || (u.middleName || '').toLowerCase().includes(query.middleName.toLowerCase())) &&
        (!query.phone || u.phone?.includes(query.phone)) &&
        (!query.email || u.email?.toLowerCase().includes(query.email.toLowerCase())) &&
        (!query.age || age === parseInt(query.age))
      );
    });
    setResults(filtered);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" mb={3}>Поиск пользователей</Typography>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><TextField label="Фамилия" fullWidth value={query.lastName} onChange={e => setQuery({...query, lastName: e.target.value})} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Имя" fullWidth value={query.firstName} onChange={e => setQuery({...query, firstName: e.target.value})} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Отчество" fullWidth value={query.middleName} onChange={e => setQuery({...query, middleName: e.target.value})} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Телефон" fullWidth value={query.phone} onChange={e => setQuery({...query, phone: e.target.value})} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Email" fullWidth value={query.email} onChange={e => setQuery({...query, email: e.target.value})} /></Grid>
          <Grid item xs={12} sm={4}><TextField label="Возраст" type="number" fullWidth value={query.age} onChange={e => setQuery({...query, age: e.target.value})} /></Grid>
        </Grid>
        <Button variant="contained" onClick={handleSearch} sx={{ mt: 3 }}>Искать</Button>
      </Paper>
      {results.length > 0 && (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {results.map(u => (
            <ListItem key={u.id}>
              <ListItemText primary={`${u.lastName} ${u.firstName} ${u.middleName || ''}`} secondary={`Телефон: ${u.phone || '-'}, Email: ${u.email}`} />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}