import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import couponService from '../../services/couponService';

const initialState = {
  coupons: [],
  currentCoupon: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  },
};

export const fetchCoupons = createAsyncThunk('coupons/fetchAll', async (params, thunkAPI) => {
  try {
    return await couponService.getCoupons(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
  }
});

export const fetchCouponById = createAsyncThunk('coupons/fetchById', async (id, thunkAPI) => {
  try {
    return await couponService.getCouponById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Coupon not found');
  }
});

export const createCoupon = createAsyncThunk('coupons/create', async (couponData, thunkAPI) => {
  try {
    return await couponService.createCoupon(couponData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
  }
});

export const updateCoupon = createAsyncThunk('coupons/update', async ({ id, data }, thunkAPI) => {
  try {
    return await couponService.updateCoupon(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
  }
});

export const deleteCoupon = createAsyncThunk('coupons/delete', async (id, thunkAPI) => {
  try {
    await couponService.deleteCoupon(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
  }
});

export const toggleCouponStatus = createAsyncThunk('coupons/toggleStatus', async (id, thunkAPI) => {
  try {
    return await couponService.toggleCouponStatus(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to toggle coupon status');
  }
});

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    resetCouponSuccess: (state) => { state.isSuccess = false; },
    clearCurrentCoupon: (state) => { state.currentCoupon = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coupons = action.payload.data || action.payload.coupons || [];
        state.pagination = action.payload.meta || action.payload.pagination || state.pagination;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.currentCoupon = action.payload;
      })
      .addCase(createCoupon.pending, (state) => { state.isLoading = true; })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCoupon.pending, (state) => { state.isLoading = true; })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const idx = state.coupons.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.coupons[idx] = action.payload;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        const idx = state.coupons.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.coupons[idx] = action.payload;
      });
  },
});

export const { resetCouponSuccess, clearCurrentCoupon } = couponSlice.actions;
export const selectCoupons = (state) => state.coupons;
export default couponSlice.reducer;
