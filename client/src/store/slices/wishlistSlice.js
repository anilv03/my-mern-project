import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistService from '../../services/wishlistService';
import { loadState, saveState, WISHLIST_KEY } from '../../utils/storage';

const saved = loadState(WISHLIST_KEY);

const initialState = {
  items: saved?.items || [],
  isLoadedFromLocal: !!saved,
  isLoading: false,
  isError: false,
  message: '',
};

export const syncWishlistToStorage = (state) => {
  saveState(WISHLIST_KEY, { items: state.items });
};

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, thunkAPI) => {
  try {
    return await wishlistService.getWishlist();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const addToWishlist = createAsyncThunk('wishlist/add', async (productId, thunkAPI) => {
  try {
    return await wishlistService.addItem(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
  }
});

export const removeFromWishlist = createAsyncThunk('wishlist/remove', async (productId, thunkAPI) => {
  try {
    return await wishlistService.removeItem(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlistItem: (state, action) => {
      const id = action.payload;
      const exists = state.items.find(item => item.product === id || item.product?._id === id);
      if (exists) {
        state.items = state.items.filter(item => item.product !== id && item.product?._id !== id);
      } else {
        state.items.push({ product: id });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchWishlist.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload || []; })
      .addCase(fetchWishlist.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(addToWishlist.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(addToWishlist.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload || state.items; })
      .addCase(addToWishlist.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(removeFromWishlist.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(removeFromWishlist.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload || []; })
      .addCase(removeFromWishlist.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});

export const { toggleWishlistItem } = wishlistSlice.actions;
export const selectWishlist = (state) => state.wishlist;
export default wishlistSlice.reducer;
