import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import walletService from '../../services/walletService';

const initialState = {
  wallet: null,
  transactions: [],
  withdrawals: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  },
};

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, thunkAPI) => {
  try {
    return await walletService.getWallet();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
  }
});

export const fetchTransactions = createAsyncThunk('wallet/fetchTransactions', async (params, thunkAPI) => {
  try {
    return await walletService.getTransactions(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
  }
});

export const addMoney = createAsyncThunk('wallet/addMoney', async ({ amount, paymentMethod }, thunkAPI) => {
  try {
    return await walletService.addMoney(amount, paymentMethod);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add money');
  }
});

export const requestWithdrawal = createAsyncThunk('wallet/requestWithdrawal', async (withdrawalData, thunkAPI) => {
  try {
    return await walletService.requestWithdrawal(withdrawalData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Withdrawal request failed');
  }
});

export const fetchWithdrawals = createAsyncThunk('wallet/fetchWithdrawals', async (params, thunkAPI) => {
  try {
    return await walletService.getWithdrawals(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch withdrawals');
  }
});

export const cancelWithdrawal = createAsyncThunk('wallet/cancelWithdrawal', async (id, thunkAPI) => {
  try {
    return await walletService.cancelWithdrawal(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to cancel withdrawal');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetWalletSuccess: (state) => {
      state.isSuccess = false;
    },
    resetWalletError: (state) => {
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => { state.isLoading = true; })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.transactions || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(addMoney.pending, (state) => { state.isLoading = true; })
      .addCase(addMoney.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.wallet = action.payload.wallet;
      })
      .addCase(addMoney.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(requestWithdrawal.pending, (state) => { state.isLoading = true; })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.withdrawals.unshift(action.payload);
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.withdrawals = action.payload.withdrawals || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(cancelWithdrawal.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.withdrawals.findIndex(w => w._id === action.payload._id);
        if (idx !== -1) state.withdrawals[idx] = action.payload;
      });
  },
});

export const { resetWalletSuccess, resetWalletError } = walletSlice.actions;
export const selectWallet = (state) => state.wallet;
export default walletSlice.reducer;
