// src/store/bonusesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../api/client';

// Получить все транзакции текущего пользователя
export const fetchTransactions = createAsyncThunk('bonuses/fetchTransactions', async () => {
  const { data } = await client.get('/bonuses/transactions');
  return data;
});

// Создать транзакцию (обычно вызывается при принятии/отклонении задачи или выводе)
export const addTransaction = createAsyncThunk('bonuses/addTransaction', async (transaction) => {
  const { data } = await client.post('/bonuses/transactions', transaction);
  return data;
});

// Вывести бонусы
export const withdrawBonuses = createAsyncThunk('bonuses/withdraw', async (amount, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/bonuses/withdraw', { amount });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Ошибка вывода');
  }
});

// Оспорить транзакцию
export const appealTransaction = createAsyncThunk('bonuses/appeal', async (id) => {
  await client.post(`/bonuses/appeal/${id}`);
  return id;
});

const bonusesSlice = createSlice({
  name: 'bonuses',
  initialState: {
    transactions: [],
    loading: false,
    error: null,
    balance: 0, // текущий баланс пользователя
  },
  reducers: {
    // Может пригодиться для сброса баланса
    clearBalance(state) {
      state.balance = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.loading = false;
        // Вычисляем баланс на основе всех транзакций
        state.balance = action.payload.reduce(
          (acc, tx) => acc + (tx.type === 'earn' ? tx.amount : -tx.amount),
          0
        );
      })
      .addCase(fetchTransactions.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
        // Обновляем баланс с учётом новой транзакции
        state.balance += action.payload.type === 'earn'
          ? action.payload.amount
          : -action.payload.amount;
      })
      .addCase(withdrawBonuses.fulfilled, (state) => {
        // Вывод уже добавлен как транзакция через addTransaction на сервере,
        // поэтому здесь можно просто запросить обновлённый список транзакций,
        // но для мгновенного отображения баланса лучше пересчитать после ответа.
        // Однако withdrawBonuses сейчас не добавляет транзакцию в локальный стейт,
        // поэтому просто запрашиваем свежие данные (опционально).
        // Можно оставить пустым или диспатчить fetchTransactions в компоненте.
      })
      .addCase(withdrawBonuses.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(appealTransaction.fulfilled, (state, action) => {
        const tx = state.transactions.find(t => t.id === action.payload);
        if (tx) tx.status = 'appealed';
      });
  },
});

export const { clearBalance } = bonusesSlice.actions;
export default bonusesSlice.reducer;