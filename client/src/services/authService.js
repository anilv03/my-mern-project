import api from './api';

const authService = {
  // --- Customer Auth ---
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data.data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  refreshToken: async (token) => {
    const { data } = await api.post('/auth/refresh-token', { refreshToken: token });
    return data.data;
  },

  // --- Email OTP ---
  sendEmailOtp: async (email, purpose = 'verification') => {
    const { data } = await api.post('/auth/send-email-otp', { email, purpose });
    return data;
  },

  verifyEmailOtp: async (email, otp) => {
    const { data } = await api.post('/auth/verify-email-otp', { email, otp });
    return data.data;
  },

  // --- Phone OTP ---
  sendPhoneOtp: async (phone, purpose = 'verification') => {
    const { data } = await api.post('/auth/send-phone-otp', { phone, purpose });
    return data;
  },

  verifyPhoneOtp: async (phone, otp) => {
    const { data } = await api.post('/auth/verify-phone-otp', { phone, otp });
    return data.data;
  },

  // --- Password ---
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const { data } = await api.post('/auth/reset-password', { token, password, confirmPassword });
    return data;
  },

  // --- Profile ---
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data.data;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.patch('/users/profile', profileData);
    return data.data;
  },

  updatePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    const { data } = await api.patch('/users/password', { currentPassword, newPassword, confirmNewPassword });
    return data;
  },

  updateAvatar: async (avatar) => {
    const { data } = await api.patch('/users/avatar', avatar);
    return data.data;
  },

  deleteAccount: async () => {
    const { data } = await api.delete('/users/account');
    return data;
  },

  // --- Addresses ---
  getAddresses: async () => {
    const { data } = await api.get('/users/addresses');
    return data.data;
  },

  addAddress: async (addressData) => {
    const { data } = await api.post('/users/addresses', addressData);
    return data.data;
  },

  updateAddress: async (id, addressData) => {
    const { data } = await api.patch(`/users/addresses/${id}`, addressData);
    return data.data;
  },

  deleteAddress: async (id) => {
    await api.delete(`/users/addresses/${id}`);
  },

  // --- Seller Auth ---
  sellerRegister: async (sellerData) => {
    const { data } = await api.post('/auth/seller/register', sellerData);
    return data.data;
  },

  submitKyc: async (kycData) => {
    const { data } = await api.post('/auth/seller/kyc', kycData);
    return data.data;
  },

  getKycStatus: async () => {
    const { data } = await api.get('/auth/seller/kyc-status');
    return data.data;
  },

  sendSecondaryPhoneOtp: async (phone) => {
    const { data } = await api.post('/auth/seller/send-secondary-phone-otp', { phone });
    return data;
  },
};

export default authService;
