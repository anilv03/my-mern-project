import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isError: false,
};

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, thunkAPI) => {
  try {
    return await notificationService.getAll();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, thunkAPI) => {
  try {
    return await notificationService.markAsRead(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, thunkAPI) => {
  try {
    await notificationService.markAllAsRead();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, thunkAPI) => {
  try {
    await notificationService.deleteOne(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications || action.payload;
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.notifications.find(n => n._id === action.payload._id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n._id !== action.payload);
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export const selectNotifications = (state) => state.notifications;
export default notificationSlice.reducer;
