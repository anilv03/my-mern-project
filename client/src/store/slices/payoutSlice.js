import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import payoutService from '../../services/payoutService';

const initialState = {
  payouts: [],
  currentPayout: null,
  summary: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  pagination: {},
};

export const fetchPayouts = createAsyncThunk('payout/fetchAll', async (params, thunkAPI) => {
  try {
    return await payoutService.getPayouts(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchPayoutById = createAsyncThunk('payout/fetchById', async (id, thunkAPI) => {
  try {
    return await payoutService.getPayoutById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const createPayout = createAsyncThunk('payout/create', async (payoutData, thunkAPI) => {
  try {
    return await payoutService.createPayout(payoutData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create');
  }
});

export const processPayout = createAsyncThunk('payout/process', async ({ id, payload }, thunkAPI) => {
  try {
    return await payoutService.processPayout(id, payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to process');
  }
});

export const fetchSettlementSummary = createAsyncThunk('payout/fetchSummary', async (_, thunkAPI) => {
  try {
    return await payoutService.getSettlementSummary();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
  }
});

const payoutSlice = createSlice({
  name: 'payout',
  initialState,
  reducers: {
    resetPayoutSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.payouts = action.payload.payouts || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPayoutById.fulfilled, (state, action) => { state.currentPayout = action.payload; })
      .addCase(createPayout.pending, (state) => { state.isLoading = true; })
      .addCase(createPayout.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        state.payouts.unshift(action.payload);
      })
      .addCase(createPayout.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(processPayout.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.payouts.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.payouts[idx] = action.payload;
      })
      .addCase(fetchSettlementSummary.fulfilled, (state, action) => { state.summary = action.payload; })
      .addMatcher((action) => action.type.startsWith('payout/') && action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.startsWith('payout/') && action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetPayoutSuccess } = payoutSlice.actions;
export default payoutSlice.reducer;
