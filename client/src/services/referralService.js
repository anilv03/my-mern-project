import api from './api';

const referralService = {
  getReferralInfo: async () => {
    const { data } = await api.get('/referral');
    return data.data;
  },

  getTeamTree: async (depth = 5) => {
    const { data } = await api.get('/referral/tree', { params: { depth } });
    return data.data;
  },

  getReferralEarnings: async (params = {}) => {
    const { data } = await api.get('/referral/earnings', { params });
    return data;
  },

  getReferralStats: async () => {
    const { data } = await api.get('/referral/stats');
    return data.data;
  },

  applyReferralCode: async (referralCode) => {
    const { data } = await api.post('/referral/apply', { referralCode });
    return data.data;
  },

  getLeaderboard: async () => {
    const { data } = await api.get('/referral/leaderboard');
    return data.data;
  },
};

export default referralService;
