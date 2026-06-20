import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../../services/reportService';

const initialState = {
  revenueReport: null,
  productReport: null,
  userReport: null,
  financialReport: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const fetchRevenueReport = createAsyncThunk('report/fetchRevenue', async (params, thunkAPI) => {
  try {
    return await reportService.getRevenueReport(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchProductReport = createAsyncThunk('report/fetchProduct', async (params, thunkAPI) => {
  try {
    return await reportService.getProductReport(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchUserReport = createAsyncThunk('report/fetchUser', async (params, thunkAPI) => {
  try {
    return await reportService.getUserReport(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchFinancialReport = createAsyncThunk('report/fetchFinancial', async (params, thunkAPI) => {
  try {
    return await reportService.getFinancialReport(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    resetReportSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenueReport.fulfilled, (state, action) => { state.revenueReport = action.payload; })
      .addCase(fetchProductReport.fulfilled, (state, action) => { state.productReport = action.payload; })
      .addCase(fetchUserReport.fulfilled, (state, action) => { state.userReport = action.payload; })
      .addCase(fetchFinancialReport.fulfilled, (state, action) => { state.financialReport = action.payload; })
      .addMatcher((action) => action.type.startsWith('report/') && action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.startsWith('report/') && action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetReportSuccess } = reportSlice.actions;
export default reportSlice.reducer;
