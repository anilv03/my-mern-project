import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../../services/chatService';

const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
  totalMessages: 0,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  isError: false,
  message: '',
  onlineUsers: [],
};

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, thunkAPI) => {
  try {
    const { data } = await chatService.getChats();
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
  }
});

export const getOrCreateChat = createAsyncThunk('chat/getOrCreate', async (chatData, thunkAPI) => {
  try {
    const { data } = await chatService.getOrCreateChat(chatData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create chat');
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async ({ chatId, page }, thunkAPI) => {
  try {
    const { data } = await chatService.getMessages(chatId, page);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
  }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ chatId, content, messageType, attachments }, thunkAPI) => {
  try {
    const { data } = await chatService.sendMessage(chatId, { content, messageType, attachments });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send message');
  }
});

export const markChatAsRead = createAsyncThunk('chat/markRead', async (chatId, thunkAPI) => {
  try {
    await chatService.markAsRead(chatId);
    return chatId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.lastMessageAt = message.createdAt;
      }
    },
    incrementUnread: (state, action) => {
      const { chatId } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) chat.unreadCount += 1;
    },
    resetUnread: (state, action) => {
      const chat = state.chats.find(c => c._id === action.payload);
      if (chat) chat.unreadCount = 0;
    },
    appendChat: (state, action) => {
      const exists = state.chats.find(c => c._id === action.payload._id);
      if (!exists) state.chats.unshift(action.payload);
    },
    clearChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchChats.fulfilled, (state, action) => { state.isLoading = false; state.chats = action.payload || []; })
      .addCase(fetchChats.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(getOrCreateChat.fulfilled, (state, action) => { state.currentChat = action.payload; })
      .addCase(fetchMessages.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { messages, page, pages, total } = action.payload;
        state.messages = page === 1 ? messages : [...messages, ...state.messages];
        state.currentPage = page;
        state.totalPages = pages;
        state.totalMessages = total;
      })
      .addCase(fetchMessages.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chat = state.chats.find(c => c._id === action.payload);
        if (chat) chat.unreadCount = 0;
      });
  },
});

export const { addMessage, setChats, updateChatLastMessage, incrementUnread, resetUnread, appendChat, clearChat } = chatSlice.actions;
export const selectChat = (state) => state.chat;
export default chatSlice.reducer;
