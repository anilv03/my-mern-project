import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';

const initialState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  bestSellers: [],
  newArrivals: [],
  videoCourses: [],
  allProducts: [],
  categories: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 12,
    totalPages: 1,
    totalProducts: 0,
  },
  filters: {
    category: '',
    productType: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'newest',
    search: '',
  },
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await productService.getAll(params);
    const meta = res.meta || {};
    return {
      products: res.data || [],
      pagination: {
        page: meta.page || 1,
        limit: meta.limit || 12,
        totalPages: meta.pages || 1,
        totalProducts: meta.total || 0,
      },
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProductBySlug = createAsyncThunk('products/fetchBySlug', async (slug, thunkAPI) => {
  try {
    return await productService.getBySlug(slug);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Product not found');
  }
});

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeatured', async (_, thunkAPI) => {
  try {
    return await productService.getFeatured();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchBestSellers = createAsyncThunk('products/fetchBestSellers', async (_, thunkAPI) => {
  try {
    return await productService.getBestSellers();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchNewArrivals = createAsyncThunk('products/fetchNewArrivals', async (_, thunkAPI) => {
  try {
    return await productService.getNewArrivals();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, thunkAPI) => {
  try {
    return await productService.getCategories();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchVideoCourses = createAsyncThunk('products/fetchVideoCourses', async (_, thunkAPI) => {
  try {
    const res = await productService.getAll({ productType: 'video_course', limit: 3, status: 'published' });
    return res.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const searchProducts = createAsyncThunk('products/search', async (query, thunkAPI) => {
  try {
    const res = await productService.search(query);
    return {
      products: res.data || [],
      pagination: {
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 12,
        totalPages: res.meta?.pages || 1,
        totalProducts: res.meta?.total || 0,
      },
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const fetchAllProducts = createAsyncThunk('products/fetchAllProducts', async (_, thunkAPI) => {
  try {
    const res = await productService.getAll({ limit: 200, status: 'published', page: 1 });
    return res.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      .addCase(fetchBestSellers.fulfilled, (state, action) => {
        state.bestSellers = action.payload;
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.newArrivals = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchVideoCourses.fulfilled, (state, action) => {
        state.videoCourses = action.payload;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allProducts = action.payload;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { setFilters, resetFilters, setPage, clearCurrentProduct } = productSlice.actions;
export const selectProducts = (state) => state.products;
export default productSlice.reducer;
