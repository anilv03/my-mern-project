import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import shippingService from '../../services/shippingService';

const initialState = {
  shipments: [],
  currentShipment: null,
  tracking: null,
  isLoading: false,
  isError: false,
  message: '',
};

export const fetchShipments = createAsyncThunk('shipping/fetchAll', async (params, thunkAPI) => {
  try {
    const { data } = await shippingService.getShipments(params);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch shipments');
  }
});

export const createShipment = createAsyncThunk('shipping/create', async (shipmentData, thunkAPI) => {
  try {
    const { data } = await shippingService.createShipment(shipmentData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create shipment');
  }
});

export const trackShipment = createAsyncThunk('shipping/track', async (id, thunkAPI) => {
  try {
    const { data } = await shippingService.trackShipment(id);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to track shipment');
  }
});

export const updateTracking = createAsyncThunk('shipping/updateTracking', async ({ id, trackingData }, thunkAPI) => {
  try {
    const { data } = await shippingService.updateTracking(id, trackingData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update tracking');
  }
});

export const getLabel = createAsyncThunk('shipping/getLabel', async (id, thunkAPI) => {
  try {
    const { data } = await shippingService.getLabel(id);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to get label');
  }
});

const shippingSlice = createSlice({
  name: 'shipping',
  initialState,
  reducers: {
    clearCurrentShipment: (state) => { state.currentShipment = null; state.tracking = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipments.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchShipments.fulfilled, (state, action) => { state.isLoading = false; state.shipments = action.payload.shipments || []; })
      .addCase(fetchShipments.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(createShipment.pending, (state) => { state.isLoading = true; })
      .addCase(createShipment.fulfilled, (state, action) => { state.isLoading = false; state.shipments.unshift(action.payload); })
      .addCase(createShipment.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(trackShipment.pending, (state) => { state.isLoading = true; })
      .addCase(trackShipment.fulfilled, (state, action) => { state.isLoading = false; state.currentShipment = action.payload.shipment; state.tracking = action.payload.tracking; })
      .addCase(trackShipment.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })
      .addCase(updateTracking.fulfilled, (state, action) => { state.currentShipment = action.payload; })
      .addCase(getLabel.fulfilled, (state, action) => { if (state.currentShipment) state.currentShipment.label = action.payload; });
  },
});

export const { clearCurrentShipment } = shippingSlice.actions;
export const selectShipping = (state) => state.shipping;
export default shippingSlice.reducer;
