import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import contentService from '../../services/contentService';

const initialState = {
  library: [],
  libraryPagination: { page: 1, totalPages: 1, total: 0 },
  courses: [],
  currentCourse: null,
  audioBooks: [],
  currentAudioBook: null,
  subscription: null,
  downloadHistory: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

export const fetchLibrary = createAsyncThunk('content/fetchLibrary', async (params, thunkAPI) => {
  try {
    return await contentService.getLibrary(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch library');
  }
});

export const fetchCourses = createAsyncThunk('content/fetchCourses', async (_, thunkAPI) => {
  try {
    return await contentService.getCourses();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
  }
});

export const fetchCourseDetail = createAsyncThunk('content/fetchCourseDetail', async (productId, thunkAPI) => {
  try {
    return await contentService.getCourseDetail(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch course detail');
  }
});

export const fetchAudioBooks = createAsyncThunk('content/fetchAudioBooks', async (_, thunkAPI) => {
  try {
    return await contentService.getAudioBooks();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch audio books');
  }
});

export const fetchAudioBookDetail = createAsyncThunk('content/fetchAudioBookDetail', async (productId, thunkAPI) => {
  try {
    return await contentService.getAudioBookDetail(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch audio book detail');
  }
});

export const fetchSubscriptionDetail = createAsyncThunk('content/fetchSubscriptionDetail', async (_, thunkAPI) => {
  try {
    return await contentService.getSubscriptionDetail();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
  }
});

export const downloadContent = createAsyncThunk('content/download', async (productId, thunkAPI) => {
  try {
    return await contentService.downloadContent(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Download failed');
  }
});

export const fetchDownloadHistory = createAsyncThunk('content/fetchDownloadHistory', async (productId, thunkAPI) => {
  try {
    return await contentService.getDownloadHistory(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch download history');
  }
});

export const updateCourseProgress = createAsyncThunk('content/updateCourseProgress', async ({ productId, progressData }, thunkAPI) => {
  try {
    return await contentService.updateCourseProgress(productId, progressData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update progress');
  }
});

export const updateAudioProgress = createAsyncThunk('content/updateAudioProgress', async ({ productId, progressData }, thunkAPI) => {
  try {
    return await contentService.updateAudioProgress(productId, progressData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update progress');
  }
});

export const renewSubscription = createAsyncThunk('content/renewSubscription', async (subscriptionId, thunkAPI) => {
  try {
    return await contentService.renewSubscription(subscriptionId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Renewal failed');
  }
});

export const buyAgain = createAsyncThunk('content/buyAgain', async (productId, thunkAPI) => {
  try {
    return await contentService.buyAgain(productId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
  }
});

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearCurrentCourse: (state) => { state.currentCourse = null; },
    clearCurrentAudioBook: (state) => { state.currentAudioBook = null; },
    resetContentSuccess: (state) => { state.isSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibrary.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchLibrary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.library = action.payload.data || [];
        state.libraryPagination = action.payload.meta || { page: 1, totalPages: 1, total: 0 };
      })
      .addCase(fetchLibrary.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchCourses.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchCourseDetail.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchAudioBooks.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAudioBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.audioBooks = action.payload;
      })
      .addCase(fetchAudioBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchAudioBookDetail.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAudioBookDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAudioBook = action.payload;
      })
      .addCase(fetchAudioBookDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchSubscriptionDetail.pending, (state) => { state.isLoading = true; })
      .addCase(fetchSubscriptionDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
      })
      .addCase(fetchSubscriptionDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(downloadContent.fulfilled, (state) => { state.isSuccess = true; })
      .addCase(downloadContent.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchDownloadHistory.fulfilled, (state, action) => {
        state.downloadHistory = action.payload;
      })
      .addCase(updateCourseProgress.fulfilled, (state, action) => {
        if (state.currentCourse) {
          state.currentCourse.progressPercent = action.payload.progressPercent;
          state.currentCourse.completedVideosCount = action.payload.completedVideosCount;
          state.currentCourse.completed = action.payload.completed;
          state.currentCourse.lastVideoIndex = action.payload.lastVideoIndex;
        }
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.isSuccess = true;
        if (state.subscription) {
          state.subscription.hasActive = true;
          state.subscription.status = action.payload.status;
          state.subscription.currentPeriodEnd = action.payload.currentPeriodEnd;
          state.subscription.currentPeriodStart = action.payload.currentPeriodStart;
        }
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(buyAgain.fulfilled, (state) => { state.isSuccess = true; })
      .addCase(buyAgain.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearCurrentCourse, clearCurrentAudioBook, resetContentSuccess } = contentSlice.actions;
export const selectContent = (state) => state.content;
export default contentSlice.reducer;
