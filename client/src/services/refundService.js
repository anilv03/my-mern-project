import api from './api';

const refundService = {
  getRefundRequests: async (params) => {
    const { data } = await api.get('/refunds', { params });
    return data.data;
  },
  processRefund: async (payload) => {
    const { data } = await api.post('/refunds/process', payload);
    return data.data;
  },
  getRefundStats: async () => {
    const { data } = await api.get('/refunds/stats');
    return data.data;
  },
};
export default refundService;
