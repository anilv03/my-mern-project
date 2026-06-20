import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import flashSaleService from '../../services/flashSaleService';

const initialState = {
  activeSales: [],
  currentSale: null,
  sales: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
};

export const fetchActiveFlashSales = createAsyncThunk('flashSale/fetchActive', async (_, thunkAPI) => {
  try {
    return await flashSaleService.getActiveFlashSales();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchFlashSaleBySlug = createAsyncThunk('flashSale/fetchBySlug', async (slug, thunkAPI) => {
  try {
    return await flashSaleService.getFlashSaleBySlug(slug);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchAllFlashSales = createAsyncThunk('flashSale/fetchAll', async (params, thunkAPI) => {
  try {
    return await flashSaleService.getAllFlashSales(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const createFlashSale = createAsyncThunk('flashSale/create', async (saleData, thunkAPI) => {
  try {
    return await flashSaleService.createFlashSale(saleData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create');
  }
});

export const updateFlashSale = createAsyncThunk('flashSale/update', async ({ id, data }, thunkAPI) => {
  try {
    return await flashSaleService.updateFlashSale(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update');
  }
});

export const deleteFlashSale = createAsyncThunk('flashSale/delete', async (id, thunkAPI) => {
  try {
    await flashSaleService.deleteFlashSale(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete');
  }
});

const flashSaleSlice = createSlice({
  name: 'flashSale',
  initialState,
  reducers: {
    resetFlashSaleSuccess: (state) => { state.isSuccess = false; },
    clearCurrentSale: (state) => { state.currentSale = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveFlashSales.fulfilled, (state, action) => { state.activeSales = action.payload; })
      .addCase(fetchFlashSaleBySlug.fulfilled, (state, action) => { state.currentSale = action.payload; })
      .addCase(fetchAllFlashSales.fulfilled, (state, action) => {
        state.sales = action.payload.sales;
        state.pagination = action.payload.pagination;
      })
      .addCase(createFlashSale.pending, (state) => { state.isLoading = true; })
      .addCase(createFlashSale.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        state.sales.unshift(action.payload);
      })
      .addCase(createFlashSale.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(updateFlashSale.fulfilled, (state, action) => { state.isSuccess = true; state.currentSale = action.payload; })
      .addCase(deleteFlashSale.fulfilled, (state, action) => { state.sales = state.sales.filter(s => s._id !== action.payload); })
      .addMatcher((action) => action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetFlashSaleSuccess, clearCurrentSale } = flashSaleSlice.actions;
export default flashSaleSlice.reducer;
