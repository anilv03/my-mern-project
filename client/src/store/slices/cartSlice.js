import toast from 'react-hot-toast';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';
import { loadState, saveState, CART_KEY } from '../../utils/storage';

const saved = loadState(CART_KEY);

const initialState = {
  items: saved?.items || [],
  coupon: saved?.coupon || null,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  isLoadedFromLocal: !!saved,
  isLoading: false,
  isError: false,
  message: '',
};

export const syncCartToStorage = (state) => {
  saveState(CART_KEY, { items: state.items, coupon: state.coupon });
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, thunkAPI) => {
  try {
    return await cartService.getCart();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/add', async (item, thunkAPI) => {
  try {
    return await cartService.addItem(item);
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to add item';
    console.error('[addToCart error]', msg, error.response?.data);
    toast.error(msg);
    return thunkAPI.rejectWithValue(msg);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ productId, quantity }, thunkAPI) => {
  try {
    return await cartService.updateItem(productId, quantity);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update item');
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (productId, thunkAPI) => {
  try {
    await cartService.removeItem(productId);
    return productId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to remove item');
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, thunkAPI) => {
  try {
    return await cartService.applyCoupon(code);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      state.subtotal = 0;
      state.total = 0;
    },
    removeCoupon: (state) => {
      state.coupon = null;
    },
    calculateTotals: (state) => {
      state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      state.discount = state.coupon ? (state.coupon.discount || 0) : 0;
      state.total = state.subtotal - state.discount + state.shipping + state.tax;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.coupon = action.payload.coupon || null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch cart';
      })
      .addCase(addToCart.pending, (state) => { state.isLoading = true; state.isError = false; state.message = ''; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to add item';
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => {
          const id = typeof item.product === 'object' ? item.product?._id : item.product;
          return id !== action.payload;
        });
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items || state.items;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.coupon = action.payload;
      });
  },
});

export const { clearCart, removeCoupon, calculateTotals } = cartSlice.actions;
export const selectCart = (state) => state.cart;
export default cartSlice.reducer;
