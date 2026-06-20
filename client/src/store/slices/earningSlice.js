import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import earningService from '../../services/earningService';

const initialState = {
  dashboard: null,
  transactions: [],
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

export const fetchEarningDashboard = createAsyncThunk('earning/fetchDashboard', async (_, thunkAPI) => {
  try {
    return await earningService.getDashboard();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
  }
});

export const fetchAllTransactions = createAsyncThunk('earning/fetchTransactions', async (params, thunkAPI) => {
  try {
    return await earningService.getTransactions(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
  }
});

const earningSlice = createSlice({
  name: 'earning',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEarningDashboard.pending, (state) => { state.isLoading = true; })
      .addCase(fetchEarningDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchEarningDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload.transactions || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      });
  },
});

export const selectEarning = (state) => state.earning;
export default earningSlice.reducer;
