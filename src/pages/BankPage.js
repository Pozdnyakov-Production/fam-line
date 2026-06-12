import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Typography, Button, Alert, Container, Paper } from '@mui/material';
import TransactionList from '../components/bank/TransactionList';
import usePermissions from '../hooks/usePermissions';
import { toggleBank } from '../store/familySlice';

export default function BankPage() {
  const dispatch = useDispatch();
  const { canOpenBank, family } = usePermissions();
  const transactions = useSelector(state => state.bonuses.transactions);
  const user = useSelector(state => state.auth.user);

  const balance = transactions
    .filter(tx => tx.userId === user.id && tx.familyId === family?.id)
    .reduce((acc, tx) => acc + (tx.type === 'earn' ? tx.amount : -tx.amount), 0);

  const isBankOpen = family?.isBankOpen;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" mb={3}>Банк</Typography>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Typography variant="h5">Баланс: {balance} бонусов</Typography>
        {!isBankOpen && <Alert severity="warning" sx={{ my: 2 }}>Банк закрыт родителями. Вывод недоступен.</Alert>}
        {canOpenBank && (
          <Button
            variant="outlined"
            color={isBankOpen ? 'error' : 'success'}
            onClick={() => dispatch(toggleBank())}
            sx={{ mb: 2 }}
          >
            {isBankOpen ? 'Закрыть банк' : 'Открыть банк'}
          </Button>
        )}
        <Button variant="contained" disabled={!isBankOpen} sx={{ ml: 2 }}>
          Вывести бонусы
        </Button>
      </Paper>
      <Typography variant="h6" mb={2}>История операций</Typography>
      <TransactionList />
    </Container>
  );
}