import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from '../../services/orderService';

const initialState = {
  orders: [],
  currentOrder: null,
  digitalOrders: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalOrders: 0,
  },
};

export const createOrder = createAsyncThunk('orders/create', async (orderData, thunkAPI) => {
  try {
    return await orderService.createOrder(orderData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create order');
  }
});

export const verifyPayment = createAsyncThunk('orders/verifyPayment', async (paymentData, thunkAPI) => {
  try {
    return await orderService.verifyPayment(paymentData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Payment verification failed');
  }
});

export const buyAgain = createAsyncThunk('orders/buyAgain', async (orderId, thunkAPI) => {
  try {
    return await orderService.buyAgain(orderId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to re-order');
  }
});

export const placeOrder = createAsyncThunk('orders/place', async (orderData, thunkAPI) => {
  try {
    return await orderService.placeOrder(orderData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Order failed');
  }
});

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, thunkAPI) => {
  try {
    return await orderService.getOrders(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id, thunkAPI) => {
  try {
    return await orderService.getOrderById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Order not found');
  }
});

export const cancelOrder = createAsyncThunk('orders/cancel', async ({ id, reason }, thunkAPI) => {
  try {
    return await orderService.cancelOrder(id, reason);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Cancellation failed');
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrderSuccess: (state) => {
      state.isSuccess = false;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(verifyPayment.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(buyAgain.fulfilled, (state, action) => {
        state.isSuccess = true;
      })
      .addCase(buyAgain.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(placeOrder.pending, (state) => { state.isLoading = true; })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentOrder = action.payload;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchOrders.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.digitalOrders = action.payload.orders.filter(o => o.orderType === 'digital' || o.isDigitalOnly);
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
      });
  },
});

export const { resetOrderSuccess, clearCurrentOrder } = orderSlice.actions;
export const selectOrders = (state) => state.orders;
export const selectDigitalOrders = (state) => state.orders.digitalOrders;
export default orderSlice.reducer;
