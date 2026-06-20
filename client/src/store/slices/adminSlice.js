import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService';

const initialState = {
  dashboard: null,
  users: [],
  sellers: [],
  products: [],
  categories: [],
  orders: [],
  orderTypeStats: { digital: 0, physical: 0, mixed: 0 },
  sellerOrders: [],
  userPurchases: [],
  payments: [],
  coupons: [],
  reviews: [],
  settings: null,
  activityLogs: [],
  walletTransactions: [],
  walletStats: null,
  creatorRewards: [],
  notifications: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  },
};

export const fetchAdminDashboard = createAsyncThunk('admin/dashboard', async (_, thunkAPI) => {
  try {
    return await adminService.getDashboard();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchUsers = createAsyncThunk('admin/users', async (params, thunkAPI) => {
  try {
    return await adminService.getUsers(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateUserStatus = createAsyncThunk('admin/updateUser', async ({ id, data }, thunkAPI) => {
  try {
    return await adminService.updateUser(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update user');
  }
});

export const fetchSellers = createAsyncThunk('admin/sellers', async (params, thunkAPI) => {
  try {
    return await adminService.getSellers(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const approveSeller = createAsyncThunk('admin/approveSeller', async ({ id, status }, thunkAPI) => {
  try {
    return await adminService.approveSeller(id, status);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to approve seller');
  }
});

export const fetchAdminProducts = createAsyncThunk('admin/products', async (params, thunkAPI) => {
  try {
    return await adminService.getProducts(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateAdminProduct = createAsyncThunk('admin/updateProduct', async ({ id, data }, thunkAPI) => {
  try {
    return await adminService.updateProduct(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const updateProductStatus = createAsyncThunk('admin/updateProductStatus', async ({ id, status, reason }, thunkAPI) => {
  try {
    return await adminService.updateProductStatus(id, status, reason);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const fetchCategories = createAsyncThunk('admin/categories', async (_, thunkAPI) => {
  try {
    return await adminService.getCategories();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createCategory = createAsyncThunk('admin/createCategory', async (data, thunkAPI) => {
  try {
    return await adminService.createCategory(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create category');
  }
});

export const updateCategory = createAsyncThunk('admin/updateCategory', async ({ id, data }, thunkAPI) => {
  try {
    return await adminService.updateCategory(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update category');
  }
});

export const deleteCategory = createAsyncThunk('admin/deleteCategory', async (id, thunkAPI) => {
  try {
    await adminService.deleteCategory(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete category');
  }
});

export const fetchAdminOrders = createAsyncThunk('admin/orders', async (params, thunkAPI) => {
  try {
    return await adminService.getOrders(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchSellerOrders = createAsyncThunk('admin/sellerOrders', async (params, thunkAPI) => {
  try {
    return await adminService.getSellerOrders(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchUserPurchases = createAsyncThunk('admin/userPurchases', async ({ userId, params }, thunkAPI) => {
  try {
    return await adminService.getUserPurchases(userId, params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateAdminOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status, items }, { rejectWithValue }) => {
    try {
      let updatedOrder;
      for (const item of items) {
        updatedOrder = await adminService.updateOrderItemStatus(id, item._id, status);
      }
      return updatedOrder;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

export const fetchCoupons = createAsyncThunk('admin/coupons', async (_, thunkAPI) => {
  try {
    return await adminService.getCoupons();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createCoupon = createAsyncThunk('admin/createCoupon', async (data, thunkAPI) => {
  try {
    return await adminService.createCoupon(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
  }
});

export const deleteCoupon = createAsyncThunk('admin/deleteCoupon', async (id, thunkAPI) => {
  try {
    await adminService.deleteCoupon(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
  }
});

export const fetchWalletTransactions = createAsyncThunk('admin/walletTransactions', async (params, thunkAPI) => {
  try {
    return await adminService.getWalletTransactions(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet transactions');
  }
});

export const fetchWalletStats = createAsyncThunk('admin/walletStats', async (_, thunkAPI) => {
  try {
    return await adminService.getWalletStats();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet stats');
  }
});

export const fetchAllCreatorRewards = createAsyncThunk('admin/creatorRewards', async (params, thunkAPI) => {
  try {
    return await adminService.getAllCreatorRewards(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch creator rewards');
  }
});

export const reviewCreatorReward = createAsyncThunk('admin/reviewCreatorReward', async ({ id, payload }, thunkAPI) => {
  try {
    return await adminService.reviewCreatorReward(id, payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to review reward');
  }
});

export const sendNotificationAdmin = createAsyncThunk('admin/sendNotification', async (payload, thunkAPI) => {
  try {
    return await adminService.sendNotification(payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send notification');
  }
});

export const fetchAllNotificationsAdmin = createAsyncThunk('admin/notifications', async (params, thunkAPI) => {
  try {
    return await adminService.getAllNotifications(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => { state.dashboard = action.payload; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.users = action.payload.users; state.pagination = action.payload.pagination; })
      .addCase(fetchSellers.fulfilled, (state, action) => { state.sellers = action.payload.sellers; state.pagination = action.payload.pagination; })
      .addCase(updateUserStatus.pending, (state) => { state.isLoading = true; })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const idx = state.users.findIndex(u => u._id === action.payload._id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(approveSeller.fulfilled, (state, action) => {
        const idx = state.sellers.findIndex(s => s._id === action.payload.user?._id);
        if (idx !== -1) state.sellers[idx] = action.payload.user;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => { state.products = action.payload.products; state.pagination = action.payload.pagination; })
      .addCase(updateAdminProduct.pending, (state) => { state.isLoading = true; state.isError = false; state.message = ''; })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const idx = state.products.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.products[idx] = action.payload;
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        const idx = state.products.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.products[idx] = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })
      .addCase(createCategory.fulfilled, (state, action) => { state.categories.push(action.payload); state.isSuccess = true; })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.categories[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => { state.categories = state.categories.filter(c => c._id !== action.payload); })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        const data = action.payload;
        state.orders = data.orders || [];
        state.orderTypeStats = data.typeStats || { digital: 0, physical: 0, mixed: 0 };
        state.pagination = data.pagination || {};
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
        state.isSuccess = true;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => { state.coupons = action.payload; })
      .addCase(createCoupon.fulfilled, (state, action) => { state.coupons.push(action.payload); state.isSuccess = true; })
      .addCase(deleteCoupon.fulfilled, (state, action) => { state.coupons = state.coupons.filter(c => c._id !== action.payload); })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.walletTransactions = action.payload.transactions || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchWalletStats.fulfilled, (state, action) => { state.walletStats = action.payload; })
      .addCase(fetchAllCreatorRewards.fulfilled, (state, action) => {
        state.creatorRewards = action.payload.creatorRewards || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(reviewCreatorReward.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.creatorRewards?.findIndex(r => r._id === action.payload._id);
        if (idx !== -1 && idx !== undefined) state.creatorRewards[idx] = action.payload;
      })
      .addCase(sendNotificationAdmin.fulfilled, (state, action) => { state.isSuccess = true; })
      .addCase(fetchAllNotificationsAdmin.fulfilled, (state, action) => { state.notifications = action.payload.notifications || action.payload.data || []; })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.sellerOrders = action.payload.orders || action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserPurchases.fulfilled, (state, action) => {
        state.userPurchases = action.payload.orders || action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      });
  },
});

export const { resetAdminSuccess } = adminSlice.actions;
export const selectAdmin = (state) => state.admin;
export default adminSlice.reducer;
