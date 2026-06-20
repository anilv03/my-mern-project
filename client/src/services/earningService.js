import api from './api';

const earningService = {
  getDashboard: async () => {
    const { data } = await api.get('/earnings/dashboard');
    return data.data;
  },

  getTransactions: async (params = {}) => {
    const { data } = await api.get('/earnings/transactions', { params });
    return data;
  },
};

export default earningService;
