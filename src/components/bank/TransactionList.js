import React from 'react';
import { List, ListItem, ListItemText, IconButton, Typography, Paper } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { useDispatch, useSelector } from 'react-redux';
import { appealTransaction } from '../../store/bonusesSlice';
import usePermissions from '../../hooks/usePermissions';

export default function TransactionList() {
  const transactions = useSelector(state => state.bonuses.transactions);
  const user = useSelector(state => state.auth.user);
  const { family } = usePermissions();
  const dispatch = useDispatch();

  const userTx = transactions.filter(tx => tx.userId === user.id && tx.familyId === family?.id);

  return (
    <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <List>
        {userTx.map(tx => (
          <ListItem
            key={tx.id}
            secondaryAction={
              tx.status !== 'appealed' && (
                <IconButton edge="end" onClick={() => dispatch(appealTransaction(tx.id))} title="Оспорить">
                  <GavelIcon />
                </IconButton>
              )
            }
          >
            <ListItemText
              primary={`${tx.type === 'earn' ? 'Зачисление' : 'Списание'} ${tx.amount} бонусов`}
              secondary={new Date(tx.date).toLocaleString()}
            />
            {tx.status === 'appealed' && <Typography variant="caption" color="warning.main">Апелляция</Typography>}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}