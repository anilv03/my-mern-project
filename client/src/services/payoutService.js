import api from './api';

const payoutService = {
  getPayouts: async (params) => {
    const { data } = await api.get('/payouts', { params });
    return data.data;
  },
  getPayoutById: async (id) => {
    const { data } = await api.get(`/payouts/${id}`);
    return data.data;
  },
  createPayout: async (payoutData) => {
    const { data } = await api.post('/payouts', payoutData);
    return data.data;
  },
  processPayout: async (id, payload) => {
    const { data } = await api.patch(`/payouts/${id}/process`, payload);
    return data.data;
  },
  getSettlementSummary: async () => {
    const { data } = await api.get('/payouts/summary');
    return data.data;
  },
};
export default payoutService;
