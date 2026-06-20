import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sellerService from '../../services/sellerService';

const initialState = {
  dashboard: null,
  products: [],
  currentProduct: null,
  orders: [],
  earnings: null,
  payouts: [],
  wallet: null,
  withdrawals: [],
  bankAccounts: [],
  analytics: null,
  sellerReferrals: null,
  withdrawalPagination: {},
  reviews: [],
  flashSales: [],
  flashSaleStats: { active: 0, upcoming: 0, ended: 0 },
  settings: null,
  profile: null,
  shippingLabel: null,
  invoiceData: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  },
};

export const fetchSellerDashboard = createAsyncThunk('seller/dashboard', async (_, thunkAPI) => {
  try {
    return await sellerService.getDashboard();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchSellerProducts = createAsyncThunk('seller/products', async (params, thunkAPI) => {
  try {
    return await sellerService.getProducts(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createProduct = createAsyncThunk('seller/createProduct', async (productData, thunkAPI) => {
  try {
    return await sellerService.createProduct(productData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('seller/updateProduct', async ({ id, data }, thunkAPI) => {
  try {
    return await sellerService.updateProduct(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('seller/deleteProduct', async (id, thunkAPI) => {
  try {
    await sellerService.deleteProduct(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete product');
  }
});

export const fetchSellerOrders = createAsyncThunk('seller/orders', async (params, thunkAPI) => {
  try {
    return await sellerService.getOrders(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateOrderStatus = createAsyncThunk('seller/updateOrderStatus', async ({ id, ...payload }, thunkAPI) => {
  try {
    return await sellerService.updateOrderStatus(id, payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update status');
  }
});

export const fetchShippingLabel = createAsyncThunk('seller/shippingLabel', async (orderId, thunkAPI) => {
  try {
    return await sellerService.getShippingLabel(orderId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load shipping label');
  }
});

export const fetchInvoice = createAsyncThunk('seller/invoice', async (orderId, thunkAPI) => {
  try {
    return await sellerService.getInvoice(orderId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load invoice');
  }
});

export const fetchSellerEarnings = createAsyncThunk('seller/earnings', async (_, thunkAPI) => {
  try {
    return await sellerService.getEarnings();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchSellerReviews = createAsyncThunk('seller/reviews', async (_, thunkAPI) => {
  try {
    return await sellerService.getReviews();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const submitProductForReview = createAsyncThunk('seller/submitProduct', async (id, thunkAPI) => {
  try {
    return await sellerService.submitProduct(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to submit product');
  }
});

export const updateSellerSettings = createAsyncThunk('seller/settings', async (settings, thunkAPI) => {
  try {
    return await sellerService.updateSettings(settings);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update settings');
  }
});

export const fetchSellerWallet = createAsyncThunk('seller/wallet', async (_, thunkAPI) => {
  try {
    return await sellerService.getWallet();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load wallet');
  }
});

export const fetchSellerWithdrawals = createAsyncThunk('seller/withdrawals', async (params, thunkAPI) => {
  try {
    return await sellerService.getWithdrawals(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const requestSellerWithdrawal = createAsyncThunk('seller/requestWithdrawal', async (withdrawalData, thunkAPI) => {
  try {
    return await sellerService.requestWithdrawal(withdrawalData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to request withdrawal');
  }
});

export const cancelSellerWithdrawal = createAsyncThunk('seller/cancelWithdrawal', async (id, thunkAPI) => {
  try {
    return await sellerService.cancelWithdrawal(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to cancel withdrawal');
  }
});

export const fetchSellerBankAccounts = createAsyncThunk('seller/bankAccounts', async (_, thunkAPI) => {
  try {
    return await sellerService.getBankAccounts();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load bank accounts');
  }
});

export const createSellerBankAccount = createAsyncThunk('seller/createBankAccount', async (accountData, thunkAPI) => {
  try {
    return await sellerService.createBankAccount(accountData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add bank account');
  }
});

export const updateSellerBankAccount = createAsyncThunk('seller/updateBankAccount', async ({ id, data }, thunkAPI) => {
  try {
    return await sellerService.updateBankAccount(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update bank account');
  }
});

export const deleteSellerBankAccount = createAsyncThunk('seller/deleteBankAccount', async (id, thunkAPI) => {
  try {
    await sellerService.deleteBankAccount(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete bank account');
  }
});

export const setDefaultSellerBankAccount = createAsyncThunk('seller/setDefaultBankAccount', async (id, thunkAPI) => {
  try {
    return await sellerService.setDefaultBankAccount(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to set default bank account');
  }
});

export const fetchSellerAnalytics = createAsyncThunk('seller/analytics', async (params, thunkAPI) => {
  try {
    return await sellerService.getAnalytics(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchSellerReferrals = createAsyncThunk('seller/referrals', async (_, thunkAPI) => {
  try {
    return await sellerService.getSellerReferrals();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load referrals');
  }
});

export const replyToReview = createAsyncThunk('seller/replyToReview', async ({ reviewId, reply }, thunkAPI) => {
  try {
    return await sellerService.replyToReview(reviewId, reply);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to reply');
  }
});

export const fetchSellerFlashSales = createAsyncThunk('seller/flashSales', async (params, thunkAPI) => {
  try {
    return await sellerService.getFlashSales(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load flash sales');
  }
});

export const createSellerFlashSale = createAsyncThunk('seller/createFlashSale', async (payload, thunkAPI) => {
  try {
    return await sellerService.createFlashSale(payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create flash sale');
  }
});

export const updateSellerFlashSale = createAsyncThunk('seller/updateFlashSale', async ({ id, data }, thunkAPI) => {
  try {
    return await sellerService.updateFlashSale(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update flash sale');
  }
});

export const toggleSellerFlashSale = createAsyncThunk('seller/toggleFlashSale', async (id, thunkAPI) => {
  try {
    return await sellerService.toggleFlashSale(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to toggle flash sale');
  }
});

export const deleteSellerFlashSale = createAsyncThunk('seller/deleteFlashSale', async (id, thunkAPI) => {
  try {
    await sellerService.deleteFlashSale(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete flash sale');
  }
});

export const fetchSellerSettings = createAsyncThunk('seller/fetchSettings', async (_, thunkAPI) => {
  try {
    return await sellerService.getSettings();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load settings');
  }
});

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    resetSellerSuccess: (state) => { state.isSuccess = false; },
    resetSellerFormState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    clearCurrentProduct: (state) => { state.currentProduct = null; },
    clearShippingLabel: (state) => { state.shippingLabel = null; },
    clearInvoiceData: (state) => { state.invoiceData = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerDashboard.fulfilled, (state, action) => { state.dashboard = action.payload; })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentProduct = action.payload;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.products.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.products[idx] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p._id !== action.payload);
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(fetchSellerEarnings.fulfilled, (state, action) => { state.earnings = action.payload; })
      .addCase(fetchSellerReviews.fulfilled, (state, action) => { state.reviews = action.payload; })
      .addCase(submitProductForReview.fulfilled, (state, action) => {
        const idx = state.products.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.products[idx] = action.payload;
      })
      .addCase(updateSellerSettings.fulfilled, (state, action) => { state.settings = action.payload; })
      .addCase(fetchSellerWallet.fulfilled, (state, action) => { state.wallet = action.payload; })
      .addCase(fetchSellerWithdrawals.fulfilled, (state, action) => {
        state.withdrawals = action.payload.withdrawals;
        state.withdrawalPagination = action.payload.pagination;
      })
      .addCase(requestSellerWithdrawal.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.withdrawals.unshift(action.payload);
        if (state.wallet) {
          state.wallet.balance = Math.max(0, state.wallet.balance - action.payload.amount);
          state.wallet.pendingBalance = (state.wallet.pendingBalance || 0) + action.payload.amount;
        }
      })
      .addCase(cancelSellerWithdrawal.fulfilled, (state, action) => {
        const idx = state.withdrawals.findIndex(w => w._id === action.payload._id);
        if (idx !== -1) state.withdrawals[idx] = action.payload;
        if (state.wallet && action.payload.status === 'cancelled') {
          state.wallet.balance += action.payload.amount;
          state.wallet.pendingBalance = Math.max(0, (state.wallet.pendingBalance || 0) - action.payload.amount);
        }
      })
      .addCase(fetchSellerBankAccounts.fulfilled, (state, action) => { state.bankAccounts = action.payload; })
      .addCase(createSellerBankAccount.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.bankAccounts.unshift(action.payload);
      })
      .addCase(updateSellerBankAccount.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.bankAccounts.findIndex(a => a._id === action.payload._id);
        if (idx !== -1) state.bankAccounts[idx] = action.payload;
      })
      .addCase(deleteSellerBankAccount.fulfilled, (state, action) => {
        state.bankAccounts = state.bankAccounts.filter(a => a._id !== action.payload);
      })
      .addCase(setDefaultSellerBankAccount.fulfilled, (state, action) => {
        state.bankAccounts = state.bankAccounts.map(a => ({
          ...a,
          isDefault: a._id === action.payload._id,
        }));
      })
      .addCase(fetchSellerAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(fetchSellerReferrals.fulfilled, (state, action) => { state.sellerReferrals = action.payload; })
      .addCase(replyToReview.fulfilled, (state, action) => {
        state.isSuccess = true;
        if (state.reviews?.reviews) {
          const idx = state.reviews.reviews.findIndex(r => r._id === action.payload._id);
          if (idx !== -1) state.reviews.reviews[idx] = action.payload;
        }
      })
      .addCase(fetchSellerFlashSales.fulfilled, (state, action) => {
        state.flashSales = action.payload.sales;
        state.flashSaleStats = action.payload.stats || { active: 0, upcoming: 0, ended: 0 };
        state.pagination = action.payload.pagination;
      })
      .addCase(createSellerFlashSale.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.flashSales.unshift(action.payload);
      })
      .addCase(updateSellerFlashSale.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.flashSales.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.flashSales[idx] = action.payload;
      })
      .addCase(toggleSellerFlashSale.fulfilled, (state, action) => {
        const idx = state.flashSales.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.flashSales[idx] = action.payload;
      })
      .addCase(deleteSellerFlashSale.fulfilled, (state, action) => {
        state.flashSales = state.flashSales.filter(s => s._id !== action.payload);
      })
      .addCase(fetchShippingLabel.fulfilled, (state, action) => { state.shippingLabel = action.payload; })
      .addCase(fetchInvoice.fulfilled, (state, action) => { state.invoiceData = action.payload; })
      .addCase(fetchSellerSettings.fulfilled, (state, action) => { state.settings = action.payload; })
      .addMatcher(
        (action) => action.type.startsWith('seller/') && action.type.endsWith('/pending'),
        (state) => { state.isLoading = true; state.isError = false; state.message = ''; }
      )
      .addMatcher(
        (action) => action.type.startsWith('seller/') && action.type.endsWith('/fulfilled'),
        (state) => { state.isLoading = false; }
      )
      .addMatcher(
        (action) => action.type.startsWith('seller/') && action.type.endsWith('/rejected'),
        (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload || action.error?.message; }
      );
  },
});

export const { resetSellerSuccess, resetSellerFormState, clearCurrentProduct, clearShippingLabel, clearInvoiceData } = sellerSlice.actions;
export const selectSeller = (state) => state.seller;
export default sellerSlice.reducer;
