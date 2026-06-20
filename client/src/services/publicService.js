import api from './api';

const publicService = {
  getHomepageData: async () => {
    const { data } = await api.get('/public/homepage');
    return data.data;
  },

  getStats: async () => {
    const { data } = await api.get('/public/stats');
    return data.data;
  },
};

export default publicService;
