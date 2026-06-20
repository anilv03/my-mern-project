import api from './api';

const adminService = {
  getDashboard: async () => {
    const { data } = await api.get('/admin/dashboard');
    return data.data;
  },

  getUsers: async (params = {}) => {
    const { data } = await api.get('/admin/users', { params });
    return { users: data.data, pagination: data.meta };
  },

  updateUser: async (id, userData) => {
    const { data } = await api.patch(`/admin/users/${id}`, userData);
    return data.data;
  },

  getSellers: async (params = {}) => {
    const { data } = await api.get('/admin/sellers', { params });
    return { sellers: data.data, pagination: data.meta };
  },

  approveSeller: async (id, status) => {
    const { data } = await api.patch(`/admin/sellers/${id}/approve`, { status });
    return data.data;
  },

  getProducts: async (params = {}) => {
    const { data } = await api.get('/admin/products', { params });
    return { products: data.data, pagination: data.meta };
  },

  updateProduct: async (id, productData) => {
    const { data } = await api.put(`/admin/products/${id}`, productData);
    return data.data;
  },

  updateProductStatus: async (id, status, rejectionReason) => {
    const { data } = await api.patch(`/admin/products/${id}/status`, { status, rejectionReason });
    return data.data;
  },

  getCategories: async () => {
    const { data } = await api.get('/admin/categories');
    return data.data;
  },

  createCategory: async (categoryData) => {
    const { data } = await api.post('/admin/categories', categoryData);
    return data.data;
  },

  updateCategory: async (id, categoryData) => {
    const { data } = await api.patch(`/admin/categories/${id}`, categoryData);
    return data.data;
  },

  deleteCategory: async (id) => {
    await api.delete(`/admin/categories/${id}`);
  },

  getOrders: async (params = {}) => {
    const { data } = await api.get('/admin/orders', { params });
    const result = data.data || {};
    return {
      orders: result.orders || [],
      typeStats: result.typeStats || { digital: 0, physical: 0, mixed: 0 },
      pagination: data.meta,
    };
  },

  getSellerOrders: async (params = {}) => {
    const { data } = await api.get('/admin/seller-orders', { params });
    return { orders: data.data, pagination: data.meta };
  },

  getUserPurchases: async (userId, params = {}) => {
    const { data } = await api.get(`/admin/users/${userId}/purchases`, { params });
    return { orders: data.data, pagination: data.meta };
  },

  updateOrderItemStatus: async (id, itemId, status) => {
    const { data } = await api.patch(`/orders/${id}/status`, { itemId, status });
    return data.data;
  },

  getPayments: async (params = {}) => {
    const { data } = await api.get('/admin/payments', { params });
    return data.data;
  },

  getCoupons: async () => {
    const { data } = await api.get('/admin/coupons');
    return data.data;
  },

  createCoupon: async (couponData) => {
    const { data } = await api.post('/admin/coupons', couponData);
    return data.data;
  },

  deleteCoupon: async (id) => {
    await api.delete(`/admin/coupons/${id}`);
  },

  getActivityLogs: async (params = {}) => {
    const { data } = await api.get('/admin/activity-logs', { params });
    return data.data;
  },

  updateSettings: async (settings) => {
    const { data } = await api.patch('/admin/settings', settings);
    return data.data;
  },

  getWalletStats: async () => {
    const { data } = await api.get('/admin/wallet/stats');
    return data.data;
  },

  getWalletTransactions: async (params = {}) => {
    const { data } = await api.get('/admin/wallet/transactions', { params });
    return data.data;
  },

  creditWallet: async (payload) => {
    const { data } = await api.post('/admin/wallet/credit', payload);
    return data.data;
  },

  debitWallet: async (payload) => {
    const { data } = await api.post('/admin/wallet/debit', payload);
    return data.data;
  },

  getRefunds: async (params = {}) => {
    const { data } = await api.get('/admin/refunds', { params });
    return data.data;
  },

  approveRefund: async (orderId, refundAmount) => {
    const { data } = await api.post('/admin/refunds/process', { orderId, action: 'approve', refundAmount });
    return data.data;
  },

  rejectRefund: async (orderId, reason) => {
    const { data } = await api.post('/admin/refunds/process', { orderId, action: 'reject', reason });
    return data.data;
  },

  getSettlementSummary: async () => {
    const { data } = await api.get('/admin/settlements/summary');
    return data.data;
  },

  getPayouts: async (params = {}) => {
    const { data } = await api.get('/admin/settlements/payouts', { params });
    return data.data;
  },

  createPayout: async (payload) => {
    const { data } = await api.post('/admin/settlements/payouts', payload);
    return data.data;
  },

  processPayout: async (id, payload) => {
    const { data } = await api.patch(`/admin/settlements/payouts/${id}`, payload);
    return data.data;
  },

  getReferralAnalytics: async () => {
    const { data } = await api.get('/admin/referral-analytics');
    return data.data;
  },

  getPendingReferralRewards: async (params = {}) => {
    const { data } = await api.get('/admin/referral/pending-rewards', { params });
    return data;
  },

  approveReferralReward: async (id) => {
    const { data } = await api.put(`/admin/referral/rewards/${id}/approve`);
    return data.data;
  },

  rejectReferralReward: async (id, reason) => {
    const { data } = await api.put(`/admin/referral/rewards/${id}/reject`, { reason });
    return data.data;
  },

  getAllCreatorRewards: async (params = {}) => {
    const { data } = await api.get('/admin/creator-rewards', { params });
    return data.data;
  },

  reviewCreatorReward: async (id, payload) => {
    const { data } = await api.put(`/admin/creator-rewards/${id}/review`, payload);
    return data.data;
  },

  getBlogs: async (params = {}) => {
    const { data } = await api.get('/admin/cms/blogs', { params });
    return data.data;
  },

  createBlog: async (blogData) => {
    const { data } = await api.post('/admin/cms/blogs', blogData);
    return data.data;
  },

  updateBlog: async (id, blogData) => {
    const { data } = await api.put(`/admin/cms/blogs/${id}`, blogData);
    return data.data;
  },

  deleteBlog: async (id) => {
    await api.delete(`/admin/cms/blogs/${id}`);
  },

  getPages: async (params = {}) => {
    const { data } = await api.get('/admin/cms/pages', { params });
    return data.data;
  },

  createPage: async (pageData) => {
    const { data } = await api.post('/admin/cms/pages', pageData);
    return data.data;
  },

  updatePage: async (id, pageData) => {
    const { data } = await api.put(`/admin/cms/pages/${id}`, pageData);
    return data.data;
  },

  deletePage: async (id) => {
    await api.delete(`/admin/cms/pages/${id}`);
  },

  getFlashSales: async (params = {}) => {
    const { data } = await api.get('/flash-sales', { params });
    return data.data;
  },

  createFlashSale: async (payload) => {
    const { data } = await api.post('/flash-sales', payload);
    return data.data;
  },

  updateFlashSale: async (id, payload) => {
    const { data } = await api.put(`/flash-sales/${id}`, payload);
    return data.data;
  },

  deleteFlashSale: async (id) => {
    await api.delete(`/flash-sales/${id}`);
  },

  toggleFlashSale: async (id) => {
    const { data } = await api.patch(`/flash-sales/${id}/toggle`);
    return data.data;
  },

  getReportsRevenue: async (params = {}) => {
    const { data } = await api.get('/admin/reports/revenue', { params });
    return data.data;
  },

  getReportsProducts: async (params = {}) => {
    const { data } = await api.get('/admin/reports/products', { params });
    return data.data;
  },

  getReportsUsers: async (params = {}) => {
    const { data } = await api.get('/admin/reports/users', { params });
    return data.data;
  },

  getReportsFinancial: async (params = {}) => {
    const { data } = await api.get('/admin/reports/financial', { params });
    return data.data;
  },

  getAllNotifications: async (params = {}) => {
    const { data } = await api.get('/admin/notifications', { params });
    return data.data;
  },

  sendNotification: async (payload) => {
    const { data } = await api.post('/admin/notifications/send', payload);
    return data.data;
  },

  getSettings: async () => {
    const { data } = await api.get('/admin/settings');
    return data.data;
  },

  getSupportTickets: async (params = {}) => {
    const { data } = await api.get('/admin/support-tickets', { params });
    return data.data;
  },

  getSupportTicketById: async (id) => {
    const { data } = await api.get(`/admin/support-tickets/${id}`);
    return data.data;
  },

  replyToTicket: async (id, message) => {
    const { data } = await api.post(`/admin/support-tickets/${id}/reply`, { message });
    return data.data;
  },

  assignTicket: async (id, assignedTo) => {
    const { data } = await api.patch(`/admin/support-tickets/${id}/assign`, { assignedTo });
    return data.data;
  },

  closeTicket: async (id) => {
    const { data } = await api.patch(`/admin/support-tickets/${id}/close`);
    return data.data;
  },

  reopenTicket: async (id) => {
    const { data } = await api.patch(`/admin/support-tickets/${id}/reopen`);
    return data.data;
  },

  getRoles: async () => {
    const { data } = await api.get('/admin/roles');
    return data.data;
  },

  createRole: async (roleData) => {
    const { data } = await api.post('/admin/roles', roleData);
    return data.data;
  },

  updateRole: async (id, roleData) => {
    const { data } = await api.put(`/admin/roles/${id}`, roleData);
    return data.data;
  },

  deleteRole: async (id) => {
    await api.delete(`/admin/roles/${id}`);
  },

  getPermissions: async () => {
    const { data } = await api.get('/admin/permissions');
    return data.data;
  },

  getWithdrawalRequests: async (params = {}) => {
    const { data } = await api.get('/admin/withdrawals', { params });
    return data.data;
  },

  getWithdrawalStats: async () => {
    const { data } = await api.get('/admin/withdrawals/stats');
    return data.data;
  },

  approveWithdrawal: async (id, transactionRef) => {
    const { data } = await api.patch(`/admin/withdrawals/${id}/approve`, { transactionRef });
    return data.data;
  },

  rejectWithdrawal: async (id, reason) => {
    const { data } = await api.patch(`/admin/withdrawals/${id}/reject`, { reason });
    return data.data;
  },

  getSellerVerifications: async (params = {}) => {
    const { data } = await api.get('/admin/seller-verifications', { params });
    return data.data;
  },

  getSellerVerificationById: async (id) => {
    const { data } = await api.get(`/admin/seller-verifications/${id}`);
    return data.data;
  },

  verifySellerKyc: async (id, payload) => {
    const { data } = await api.patch(`/admin/seller-verifications/${id}/verify`, payload);
    return data.data;
  },

  getPendingSettlements: async (params = {}) => {
    const { data } = await api.get('/admin/settlements/pending', { params });
    return data.data;
  },

  approveSettlement: async (orderId, itemId) => {
    const { data } = await api.put(`/admin/settlements/${orderId}/items/${itemId}/approve`);
    return data.data;
  },

  getSellerReferralTrees: async (params = {}) => {
    const { data } = await api.get('/admin/sellers/referral-trees', { params });
    return { sellers: data.data, pagination: data.meta };
  },

  getProductApprovals: async (params = {}) => {
    const { data } = await api.get('/admin/product-approvals', { params });
    return data.data;
  },

  batchApproveProducts: async (ids) => {
    const { data } = await api.post('/admin/product-approvals/batch-approve', { ids });
    return data.data;
  },

  batchRejectProducts: async (ids, reason) => {
    const { data } = await api.post('/admin/product-approvals/batch-reject', { ids, reason });
    return data.data;
  },
};

export default adminService;
