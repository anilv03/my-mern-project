import api from './api';

const sellerService = {
  getDashboard: async () => {
    const { data } = await api.get('/seller/dashboard');
    return data.data;
  },

  getProducts: async (params = {}) => {
    const { data } = await api.get('/seller/products', { params });
    return data.data;
  },

  createProduct: async (productData) => {
    const { data } = await api.post('/seller/products', productData);
    return data.data;
  },

  getProductById: async (id) => {
    const { data } = await api.get(`/seller/products/${id}`);
    return data.data;
  },

  updateProduct: async (id, productData) => {
    const { data } = await api.put(`/seller/products/${id}`, productData);
    return data.data;
  },

  submitProduct: async (id) => {
    const { data } = await api.patch(`/seller/products/${id}/submit`);
    return data.data;
  },

  bulkUpdateProducts: async (productIds, action, value) => {
    const { data } = await api.post('/seller/products/bulk', { productIds, action, value });
    return data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/seller/products/${id}`);
  },

  getOrders: async (params = {}) => {
    const { data } = await api.get('/seller/orders', { params });
    return data.data;
  },

  updateOrderStatus: async (id, payload) => {
    const { data } = await api.patch(`/seller/orders/${id}/status`, payload);
    return data.data;
  },

  getShippingLabel: async (orderId) => {
    const { data } = await api.get(`/seller/orders/${orderId}/shipping-label`);
    return data.data;
  },

  getInvoice: async (orderId) => {
    const { data } = await api.get(`/seller/orders/${orderId}/invoice`);
    return data.data;
  },

  getEarnings: async () => {
    const { data } = await api.get('/seller/earnings');
    return data.data;
  },

  getPayouts: async () => {
    const { data } = await api.get('/seller/payouts');
    return data.data;
  },

  requestPayout: async () => {
    const { data } = await api.post('/seller/request-payout');
    return data.data;
  },

  getWallet: async () => {
    const { data } = await api.get('/seller/wallet');
    return data.data;
  },

  getWithdrawals: async (params) => {
    const { data } = await api.get('/seller/withdrawals', { params });
    return data.data;
  },

  requestWithdrawal: async (withdrawalData) => {
    const { data } = await api.post('/seller/withdrawals', withdrawalData);
    return data.data;
  },

  cancelWithdrawal: async (id) => {
    const { data } = await api.put(`/seller/withdrawals/${id}/cancel`);
    return data.data;
  },

  getAnalytics: async (params) => {
    const { data } = await api.get('/seller/analytics', { params });
    return data.data;
  },

  getSellerReferrals: async () => {
    const { data } = await api.get('/seller/referrals');
    return data.data;
  },

  getReviews: async () => {
    const { data } = await api.get('/seller/reviews');
    return data.data;
  },

  replyToReview: async (reviewId, reply) => {
    const { data } = await api.post(`/reviews/${reviewId}/reply`, { comment: reply });
    return data.data;
  },

  getProfile: async () => {
    const { data } = await api.get('/seller/profile');
    return data.data;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.patch('/seller/profile', profileData);
    return data.data;
  },

  getSettings: async () => {
    const { data } = await api.get('/seller/settings');
    return data.data;
  },

  updateSettings: async (settings) => {
    const { data } = await api.patch('/seller/settings', settings);
    return data.data;
  },

  getFlashSales: async (params = {}) => {
    const { data } = await api.get('/seller/flash-sales', { params });
    return data.data;
  },

  createFlashSale: async (payload) => {
    const { data } = await api.post('/seller/flash-sales', payload);
    return data.data;
  },

  updateFlashSale: async (id, payload) => {
    const { data } = await api.put(`/seller/flash-sales/${id}`, payload);
    return data.data;
  },

  toggleFlashSale: async (id) => {
    const { data } = await api.patch(`/seller/flash-sales/${id}/toggle`);
    return data.data;
  },

  deleteFlashSale: async (id) => {
    await api.delete(`/seller/flash-sales/${id}`);
  },

  getBankAccounts: async () => {
    const { data } = await api.get('/seller/bank-accounts');
    return data.data;
  },

  createBankAccount: async (accountData) => {
    const { data } = await api.post('/seller/bank-accounts', accountData);
    return data.data;
  },

  updateBankAccount: async (id, accountData) => {
    const { data } = await api.put(`/seller/bank-accounts/${id}`, accountData);
    return data.data;
  },

  deleteBankAccount: async (id) => {
    await api.delete(`/seller/bank-accounts/${id}`);
  },

  setDefaultBankAccount: async (id) => {
    const { data } = await api.patch(`/seller/bank-accounts/${id}/default`);
    return data.data;
  },
};

export default sellerService;
