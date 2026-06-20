import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import creatorRewardService from '../../services/creatorRewardService';

const initialState = {
  rewards: [],
  stats: null,
  settings: null,
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

export const submitContent = createAsyncThunk('creatorReward/submit', async (contentData, thunkAPI) => {
  try {
    return await creatorRewardService.submitContent(contentData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to submit content');
  }
});

export const fetchUserRewards = createAsyncThunk('creatorReward/fetchUserRewards', async (params, thunkAPI) => {
  try {
    return await creatorRewardService.getUserRewards(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch rewards');
  }
});

export const fetchRewardStats = createAsyncThunk('creatorReward/fetchStats', async (_, thunkAPI) => {
  try {
    return await creatorRewardService.getRewardStats();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
  }
});

export const fetchRewardSettings = createAsyncThunk('creatorReward/fetchSettings', async (_, thunkAPI) => {
  try {
    return await creatorRewardService.getSettings();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
  }
});

const creatorRewardSlice = createSlice({
  name: 'creatorReward',
  initialState,
  reducers: {
    resetCreatorRewardSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitContent.pending, (state) => { state.isLoading = true; })
      .addCase(submitContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.rewards.unshift(action.payload);
      })
      .addCase(submitContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchUserRewards.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUserRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rewards = action.payload.rewards || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchRewardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchRewardSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { resetCreatorRewardSuccess } = creatorRewardSlice.actions;
export const selectCreatorReward = (state) => state.creatorReward;
export default creatorRewardSlice.reducer;
