import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import publicService from '../../services/publicService';

const initialState = {
  stats: null,
  featuredSellers: [],
  featuredReviews: [],
  featuredProducts: [],
  bestSellers: [],
  newArrivals: [],
  videoCourses: [],
  activeSales: [],
  featuredBlogs: [],
  categories: [],
  allProducts: [],
  isError: false,
  isLoading: false,
  message: '',
};

export const fetchHomepageData = createAsyncThunk('public/fetchHomepageData', async (_, thunkAPI) => {
  try {
    return await publicService.getHomepageData();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch homepage data');
  }
});

const publicSlice = createSlice({
  name: 'public',
  initialState,
  reducers: {
    resetPublic: (state) => { state.isError = false; state.isSuccess = false; state.message = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomepageData.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchHomepageData.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload;
        state.stats = p.stats;
        state.featuredSellers = p.featuredSellers || [];
        state.featuredReviews = p.featuredReviews || [];
        state.featuredProducts = p.featuredProducts || [];
        state.bestSellers = p.bestSellers || [];
        state.newArrivals = p.newArrivals || [];
        state.videoCourses = p.videoCourses || [];
        state.activeSales = p.activeSales || [];
        state.featuredBlogs = p.featuredBlogs || [];
        state.categories = p.categories || [];
        state.allProducts = p.allProducts || [];
      })
      .addCase(fetchHomepageData.rejected, (state, action) => {
        state.isLoading = false; state.isError = true; state.message = action.payload;
      });
  },
});

export const { resetPublic } = publicSlice.actions;
export default publicSlice.reducer;
