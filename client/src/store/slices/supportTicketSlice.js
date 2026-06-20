import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supportTicketService from '../../services/supportTicketService';

const initialState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  },
};

export const fetchTickets = createAsyncThunk('tickets/fetchAll', async (params, thunkAPI) => {
  try {
    return await supportTicketService.getTickets(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
  }
});

export const fetchTicketById = createAsyncThunk('tickets/fetchById', async (id, thunkAPI) => {
  try {
    return await supportTicketService.getTicketById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Ticket not found');
  }
});

export const createTicket = createAsyncThunk('tickets/create', async (ticketData, thunkAPI) => {
  try {
    return await supportTicketService.createTicket(ticketData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
  }
});

export const addTicketReply = createAsyncThunk('tickets/addReply', async ({ id, message }, thunkAPI) => {
  try {
    return await supportTicketService.addReply(id, message);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add reply');
  }
});

export const closeTicket = createAsyncThunk('tickets/close', async (id, thunkAPI) => {
  try {
    return await supportTicketService.closeTicket(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to close ticket');
  }
});

export const reopenTicket = createAsyncThunk('tickets/reopen', async (id, thunkAPI) => {
  try {
    return await supportTicketService.reopenTicket(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to reopen ticket');
  }
});

const supportTicketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    resetTicketSuccess: (state) => { state.isSuccess = false; },
    clearCurrentTicket: (state) => { state.currentTicket = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload.data || action.payload.tickets || [];
        state.pagination = action.payload.meta || action.payload.pagination || state.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
      })
      .addCase(createTicket.pending, (state) => { state.isLoading = true; })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addTicketReply.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
      })
      .addCase(closeTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        const idx = state.tickets.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tickets[idx] = action.payload;
      })
      .addCase(reopenTicket.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        const idx = state.tickets.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.tickets[idx] = action.payload;
      });
  },
});

export const { resetTicketSuccess, clearCurrentTicket } = supportTicketSlice.actions;
export const selectTickets = (state) => state.tickets;
export default supportTicketSlice.reducer;
