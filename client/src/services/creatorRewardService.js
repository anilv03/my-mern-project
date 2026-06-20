import api from './api';

const creatorRewardService = {
  submitContent: async (contentData) => {
    const { data } = await api.post('/creator-rewards', contentData);
    return data.data;
  },

  getUserRewards: async (params = {}) => {
    const { data } = await api.get('/creator-rewards', { params });
    return data;
  },

  getRewardStats: async () => {
    const { data } = await api.get('/creator-rewards/stats');
    return data.data;
  },

  getSettings: async () => {
    const { data } = await api.get('/creator-rewards/settings');
    return data.data;
  },
};

export default creatorRewardService;
