import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

const initialState = {
  plans: [],
  currentSubscription: null,
  accessMap: {},
  myProducts: { purchased: [], subscription: null },
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

export const fetchPlans = createAsyncThunk('subscriptions/fetchPlans', async (_, thunkAPI) => {
  try {
    return await subscriptionService.getPlans();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
  }
});

export const fetchMySubscription = createAsyncThunk('subscriptions/fetchMy', async (_, thunkAPI) => {
  try {
    return await subscriptionService.getMySubscription();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
  }
});

export const subscribeToPlan = createAsyncThunk('subscriptions/subscribe', async (data, thunkAPI) => {
  try {
    return await subscriptionService.subscribe(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Subscription failed');
  }
});

export const cancelMySubscription = createAsyncThunk('subscriptions/cancel', async ({ id, reason }, thunkAPI) => {
  try {
    return await subscriptionService.cancelSubscription(id, reason);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Cancellation failed');
  }
});

export const checkAccess = createAsyncThunk('subscriptions/checkAccess', async (productId, thunkAPI) => {
  try {
    return await subscriptionService.checkProductAccess(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Access check failed');
  }
});

export const fetchMyProducts = createAsyncThunk('subscriptions/fetchMyProducts', async (_, thunkAPI) => {
  try {
    return await subscriptionService.getMyProducts();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    resetSubscriptionSuccess: (state) => {
      state.isSuccess = false;
    },
    clearAccessCheck: (state) => {
      state.accessMap = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plans = action.payload;
      })
      .addCase(fetchMySubscription.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMySubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchMySubscription.rejected, (state) => {
        state.isLoading = false;
        state.currentSubscription = null;
      })
      .addCase(subscribeToPlan.pending, (state) => { state.isLoading = true; })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentSubscription = action.payload;
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(cancelMySubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
      })
      .addCase(checkAccess.fulfilled, (state, action) => {
        const productId = action.meta.arg;
        state.accessMap[productId] = action.payload;
      })
      .addCase(fetchMyProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myProducts = action.payload;
      })
      .addCase(fetchMyProducts.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { resetSubscriptionSuccess, clearAccessCheck } = subscriptionSlice.actions;
export const selectSubscriptions = (state) => state.subscriptions;
export default subscriptionSlice.reducer;
