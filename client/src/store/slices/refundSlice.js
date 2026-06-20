import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import refundService from '../../services/refundService';

const initialState = {
  refunds: [],
  stats: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  pagination: {},
};

export const fetchRefundRequests = createAsyncThunk('refund/fetchAll', async (params, thunkAPI) => {
  try {
    return await refundService.getRefundRequests(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const processRefund = createAsyncThunk('refund/process', async (payload, thunkAPI) => {
  try {
    return await refundService.processRefund(payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to process');
  }
});

export const fetchRefundStats = createAsyncThunk('refund/fetchStats', async (_, thunkAPI) => {
  try {
    return await refundService.getRefundStats();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
  }
});

const refundSlice = createSlice({
  name: 'refund',
  initialState,
  reducers: {
    resetRefundSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRefundRequests.fulfilled, (state, action) => {
        state.refunds = action.payload.refunds || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(processRefund.pending, (state) => { state.isLoading = true; })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        const idx = state.refunds.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.refunds[idx] = action.payload;
      })
      .addCase(processRefund.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(fetchRefundStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addMatcher((action) => action.type.startsWith('refund/') && action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.startsWith('refund/') && action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetRefundSuccess } = refundSlice.actions;
export default refundSlice.reducer;
