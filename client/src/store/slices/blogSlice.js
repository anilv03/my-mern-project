import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import blogService from '../../services/blogService';

const initialState = {
  blogs: [],
  currentBlog: null,
  featuredBlogs: [],
  categories: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  pagination: {},
};

export const fetchPublishedBlogs = createAsyncThunk('blog/fetchPublished', async (params, thunkAPI) => {
  try {
    return await blogService.getPublishedBlogs(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchBlogBySlug = createAsyncThunk('blog/fetchBySlug', async (slug, thunkAPI) => {
  try {
    return await blogService.getBlogBySlug(slug);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchFeaturedBlogs = createAsyncThunk('blog/fetchFeatured', async (_, thunkAPI) => {
  try {
    return await blogService.getFeaturedBlogs();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchBlogCategories = createAsyncThunk('blog/fetchCategories', async (_, thunkAPI) => {
  try {
    return await blogService.getBlogCategories();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchMyBlogs = createAsyncThunk('blog/fetchMy', async (params, thunkAPI) => {
  try {
    return await blogService.getMyBlogs(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchBlogById = createAsyncThunk('blog/fetchById', async (id, thunkAPI) => {
  try {
    return await blogService.getBlogById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchAllBlogs = createAsyncThunk('blog/fetchAll', async (params, thunkAPI) => {
  try {
    return await blogService.getAllBlogs(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch');
  }
});

export const createBlog = createAsyncThunk('blog/create', async (blogData, thunkAPI) => {
  try {
    return await blogService.createBlog(blogData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create');
  }
});

export const updateBlog = createAsyncThunk('blog/update', async ({ id, data }, thunkAPI) => {
  try {
    return await blogService.updateBlog(id, data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update');
  }
});

export const deleteBlog = createAsyncThunk('blog/delete', async (id, thunkAPI) => {
  try {
    await blogService.deleteBlog(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete');
  }
});

export const addComment = createAsyncThunk('blog/addComment', async ({ id, comment }, thunkAPI) => {
  try {
    return await blogService.addComment(id, comment);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add comment');
  }
});

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    resetBlogSuccess: (state) => { state.isSuccess = false; },
    clearCurrentBlog: (state) => { state.currentBlog = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublishedBlogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.blogs = action.payload.blogs || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => { state.isLoading = false; state.currentBlog = action.payload; })
      .addCase(fetchFeaturedBlogs.fulfilled, (state, action) => { state.isLoading = false; state.featuredBlogs = action.payload; })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => { state.isLoading = false; state.categories = action.payload; })
      .addCase(fetchMyBlogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.blogs = action.payload.blogs || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => { state.isLoading = false; state.currentBlog = action.payload; })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.blogs = action.payload.blogs || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(createBlog.pending, (state) => { state.isLoading = true; })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        state.blogs.unshift(action.payload);
      })
      .addCase(createBlog.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.isSuccess = true;
        const idx = state.blogs.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.blogs[idx] = action.payload;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => { state.blogs = state.blogs.filter(b => b._id !== action.payload); })
      .addCase(addComment.fulfilled, (state, action) => { state.isSuccess = true; })
      .addMatcher((action) => action.type.startsWith('blog/') && action.type.endsWith('/pending'), (state) => { state.isLoading = true; })
      .addMatcher((action) => action.type.startsWith('blog/') && action.type.endsWith('/rejected'), (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});
export const { resetBlogSuccess, clearCurrentBlog } = blogSlice.actions;
export default blogSlice.reducer;
