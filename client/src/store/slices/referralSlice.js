import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import referralService from '../../services/referralService';

const initialState = {
  info: null,
  teamTree: [],
  earnings: [],
  stats: null,
  leaderboard: [],
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

export const fetchReferralInfo = createAsyncThunk('referral/fetchInfo', async (_, thunkAPI) => {
  try {
    return await referralService.getReferralInfo();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch referral info');
  }
});

export const fetchTeamTree = createAsyncThunk('referral/fetchTeamTree', async (depth, thunkAPI) => {
  try {
    return await referralService.getTeamTree(depth);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch team tree');
  }
});

export const fetchReferralEarnings = createAsyncThunk('referral/fetchEarnings', async (params, thunkAPI) => {
  try {
    return await referralService.getReferralEarnings(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings');
  }
});

export const fetchReferralStats = createAsyncThunk('referral/fetchStats', async (_, thunkAPI) => {
  try {
    return await referralService.getReferralStats();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
  }
});

export const applyReferralCode = createAsyncThunk('referral/applyCode', async (referralCode, thunkAPI) => {
  try {
    return await referralService.applyReferralCode(referralCode);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to apply referral code');
  }
});

export const fetchLeaderboard = createAsyncThunk('referral/fetchLeaderboard', async (_, thunkAPI) => {
  try {
    return await referralService.getLeaderboard();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
  }
});

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    resetReferralSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralInfo.pending, (state) => { state.isLoading = true; })
      .addCase(fetchReferralInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.info = action.payload;
      })
      .addCase(fetchReferralInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchTeamTree.fulfilled, (state, action) => {
        state.teamTree = action.payload;
      })
      .addCase(fetchReferralEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload.earnings || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchReferralStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(applyReferralCode.pending, (state) => { state.isLoading = true; })
      .addCase(applyReferralCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(applyReferralCode.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      });
  },
});

export const { resetReferralSuccess } = referralSlice.actions;
export const selectReferral = (state) => state.referral;
export default referralSlice.reducer;
