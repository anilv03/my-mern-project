import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import categoryService from '../../services/categoryService';

const initialState = {
  categories: [],
  categoryTree: [],
  currentCategory: null,
  categoryProducts: [],
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

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (params, thunkAPI) => {
  try {
    return await categoryService.getAll(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchCategoryTree = createAsyncThunk('categories/fetchTree', async (_, thunkAPI) => {
  try {
    return await categoryService.getTree();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch category tree');
  }
});

export const fetchCategoryBySlug = createAsyncThunk('categories/fetchBySlug', async (slug, thunkAPI) => {
  try {
    return await categoryService.getBySlug(slug);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Category not found');
  }
});

export const fetchCategoryProducts = createAsyncThunk('categories/fetchProducts', async ({ slug, params }, thunkAPI) => {
  try {
    return await categoryService.getCategoryProducts(slug, params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const createCategory = createAsyncThunk('categories/create', async (categoryData, thunkAPI) => {
  try {
    return await categoryService.create(categoryData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create category');
  }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, data }, thunkAPI) => {
  try {
    return await categoryService.update(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update category');
  }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, thunkAPI) => {
  try {
    await categoryService.delete(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete category');
  }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    resetCategorySuccess: (state) => { state.isSuccess = false; },
    clearCurrentCategory: (state) => { state.currentCategory = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.data;
        state.pagination = action.payload.meta || state.pagination;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.categoryTree = action.payload;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryProducts.fulfilled, (state, action) => {
        state.categoryProducts = action.payload.data;
        state.pagination = action.payload.meta || state.pagination;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.categories.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.categories[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
      });
  },
});

export const { resetCategorySuccess, clearCurrentCategory } = categorySlice.actions;
export const selectCategories = (state) => state.categories;
export default categorySlice.reducer;
