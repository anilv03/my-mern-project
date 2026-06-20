import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: !!localStorage.getItem('accessToken'),
  isError: false,
  isSuccess: false,
  message: '',
  token: localStorage.getItem('accessToken') || null,
  otpSent: false,
  otpVerified: false,
  sellerKycStatus: null,
};

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const data = await authService.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  } catch (error) {
    const errData = error.response?.data;
    if (errData?.errors?.length > 0) {
      return thunkAPI.rejectWithValue({ message: errData.errors[0].message, errors: errData.errors });
    }
    return thunkAPI.rejectWithValue({ message: errData?.message || 'Login failed', errors: [] });
  }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const data = await authService.register(userData);
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  } catch (error) {
    const errData = error.response?.data;
    if (errData?.errors?.length > 0) {
      return thunkAPI.rejectWithValue({ message: errData.errors[0].message, errors: errData.errors });
    }
    return thunkAPI.rejectWithValue({ message: errData?.message || 'Registration failed', errors: [] });
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await authService.logout();
  } catch (error) {
    // ignore
  } finally {
    localStorage.removeItem('accessToken');
  }
});


export const loadUser = createAsyncThunk('auth/loadUser', async (_, thunkAPI) => {
  const token = thunkAPI.getState().auth.token;
  if (!token) {
    return thunkAPI.rejectWithValue('NO_TOKEN');
  }
  try {
    return await authService.getProfile();
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      return thunkAPI.rejectWithValue('SESSION_EXPIRED');
    }
    return thunkAPI.rejectWithValue('NETWORK_ERROR');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, thunkAPI) => {
  try {
    return await authService.updateProfile(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

export const updatePassword = createAsyncThunk('auth/updatePassword', async (passwordData, thunkAPI) => {
  try {
    await authService.updatePassword(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmNewPassword);
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Password update failed');
  }
});

// --- Email OTP ---
export const sendEmailOtp = createAsyncThunk('auth/sendEmailOtp', async ({ email, purpose }, thunkAPI) => {
  try {
    await authService.sendEmailOtp(email, purpose);
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
  }
});

export const verifyEmailOtp = createAsyncThunk('auth/verifyEmailOtp', async ({ email, otp }, thunkAPI) => {
  try {
    const result = await authService.verifyEmailOtp(email, otp);
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'OTP verification failed');
  }
});

// --- Phone OTP ---
export const sendPhoneOtp = createAsyncThunk('auth/sendPhoneOtp', async ({ phone, purpose }, thunkAPI) => {
  try {
    const result = await authService.sendPhoneOtp(phone, purpose);
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
  }
});

export const verifyPhoneOtp = createAsyncThunk('auth/verifyPhoneOtp', async ({ phone, otp }, thunkAPI) => {
  try {
    const result = await authService.verifyPhoneOtp(phone, otp);
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'OTP verification failed');
  }
});

// --- Password Reset ---
export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, thunkAPI) => {
  try {
    await authService.forgotPassword(email);
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password, confirmPassword }, thunkAPI) => {
  try {
    await authService.resetPassword(token, password, confirmPassword);
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Password reset failed');
  }
});

// --- Seller Auth ---
export const sellerRegister = createAsyncThunk('auth/sellerRegister', async (sellerData, thunkAPI) => {
  try {
    const data = await authService.sellerRegister(sellerData);
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  } catch (error) {
    const errData = error.response?.data;
    if (errData?.errors?.length > 0) {
      return thunkAPI.rejectWithValue({ message: errData.errors[0].message, errors: errData.errors });
    }
    return thunkAPI.rejectWithValue({ message: errData?.message || 'Seller registration failed', errors: [] });
  }
});

export const submitKyc = createAsyncThunk('auth/submitKyc', async (kycData, thunkAPI) => {
  try {
    const data = await authService.submitKyc(kycData);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'KYC submission failed');
  }
});

export const getKycStatus = createAsyncThunk('auth/getKycStatus', async (_, thunkAPI) => {
  try {
    return await authService.getKycStatus();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch KYC status');
  }
});

export const requestSellerRole = createAsyncThunk('auth/requestSellerRole', async (data, thunkAPI) => {
  try {
    return await authService.sellerRegister(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Request failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
      state.otpSent = false;
      state.otpVerified = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setOtpSent: (state, action) => {
      state.otpSent = action.payload;
    },
    setOtpVerified: (state, action) => {
      state.otpVerified = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login ---
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isSuccess = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = typeof action.payload === 'object' ? action.payload.message : action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      // --- Register ---
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isSuccess = true;
        state.otpSent = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = typeof action.payload === 'object' ? action.payload.message : action.payload;
      })
      // --- Logout ---
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.sellerKycStatus = null;
      })
      // --- Load User ---
      .addCase(loadUser.pending, (state) => { state.isLoading = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = localStorage.getItem('accessToken');
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload === 'NO_TOKEN' || action.payload === 'SESSION_EXPIRED') {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      // --- Update Profile ---
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isSuccess = true;
      })
      // --- Update Password ---
      .addCase(updatePassword.fulfilled, (state) => { state.isSuccess = true; })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // --- Email OTP ---
      .addCase(sendEmailOtp.fulfilled, (state) => { state.otpSent = true; })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.otpVerified = true;
        if (state.user) state.user.isVerified = true;
      })
      // --- Phone OTP ---
      .addCase(sendPhoneOtp.fulfilled, (state) => { state.otpSent = true; })
      .addCase(verifyPhoneOtp.fulfilled, (state, action) => {
        state.otpVerified = true;
        if (state.user) state.user.isPhoneVerified = true;
      })
      // --- Forgot Password ---
      .addCase(forgotPassword.fulfilled, (state) => { state.isSuccess = true; })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // --- Reset Password ---
      .addCase(resetPassword.fulfilled, (state) => { state.isSuccess = true; })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // --- Seller Register ---
      .addCase(sellerRegister.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(sellerRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isSuccess = true;
        state.otpSent = true;
      })
      .addCase(sellerRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = typeof action.payload === 'object' ? action.payload.message : action.payload;
      })
      // --- Submit KYC ---
      .addCase(submitKyc.pending, (state) => { state.isLoading = true; })
      .addCase(submitKyc.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user || state.user;
        state.sellerKycStatus = action.payload.sellerStatus;
        if (state.user) {
          state.user.sellerStatus = action.payload.sellerStatus;
          state.user.isSellerApproved = action.payload.isSellerApproved;
        }
      })
      .addCase(submitKyc.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // --- Get KYC Status ---
      .addCase(getKycStatus.fulfilled, (state, action) => {
        state.sellerKycStatus = action.payload;
      })
      // --- Request Seller Role ---
      .addCase(requestSellerRole.pending, (state) => { state.isLoading = true; })
      .addCase(requestSellerRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
      })
      .addCase(requestSellerRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setUser, setOtpSent, setOtpVerified } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export default authSlice.reducer;
