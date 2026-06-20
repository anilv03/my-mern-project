import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cashbackService from '../../services/cashbackService';

const initialState = {
  settings: null,
  cashbacks: [],
  stats: null,
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

export const fetchCashbackSettings = createAsyncThunk('cashback/fetchSettings', async (_, thunkAPI) => {
  try {
    return await cashbackService.getSettings();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
  }
});

export const fetchUserCashbacks = createAsyncThunk('cashback/fetchUserCashbacks', async (params, thunkAPI) => {
  try {
    return await cashbackService.getUserCashbacks(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cashbacks');
  }
});

export const fetchCashbackStats = createAsyncThunk('cashback/fetchStats', async (_, thunkAPI) => {
  try {
    return await cashbackService.getCashbackStats();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
  }
});

const cashbackSlice = createSlice({
  name: 'cashback',
  initialState,
  reducers: {
    resetCashbackSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashbackSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(fetchUserCashbacks.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUserCashbacks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashbacks = action.payload.cashbacks || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserCashbacks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchCashbackStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { resetCashbackSuccess } = cashbackSlice.actions;
export const selectCashback = (state) => state.cashback;
export default cashbackSlice.reducer;
