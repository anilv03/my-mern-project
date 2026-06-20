import api from './api';

const cashbackService = {
  getSettings: async () => {
    const { data } = await api.get('/cashback/settings');
    return data.data;
  },

  getUserCashbacks: async (params = {}) => {
    const { data } = await api.get('/cashback', { params });
    return data;
  },

  getCashbackStats: async () => {
    const { data } = await api.get('/cashback/stats');
    return data.data;
  },
};

export default cashbackService;
