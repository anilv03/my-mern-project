import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import newsletterService from '../../services/newsletterService';

const initialState = {
  count: 0,
  subscribers: [],
  pagination: {},
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const subscribeNewsletter = createAsyncThunk('newsletter/subscribe', async ({ email, source }, thunkAPI) => {
  try {
    return await newsletterService.subscribe(email, source);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to subscribe');
  }
});

export const fetchSubscribers = createAsyncThunk('newsletter/fetchSubscribers', async (params, thunkAPI) => {
  try {
    return await newsletterService.getSubscribers(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch subscribers');
  }
});

export const fetchSubscriberCount = createAsyncThunk('newsletter/fetchCount', async (_, thunkAPI) => {
  try {
    return await newsletterService.getSubscriberCount();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch count');
  }
});

const newsletterSlice = createSlice({
  name: 'newsletter',
  initialState,
  reducers: {
    resetNewsletterSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeNewsletter.fulfilled, (state) => {
        state.isLoading = false; state.isSuccess = true;
      })
      .addCase(fetchSubscribers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscribers = action.payload.subscribers || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSubscriberCount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.count = action.payload.count || action.payload;
      })
      .addMatcher((action) => action.type.startsWith('newsletter/') && action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.startsWith('newsletter/') && action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetNewsletterSuccess } = newsletterSlice.actions;
export default newsletterSlice.reducer;
