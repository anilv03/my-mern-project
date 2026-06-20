import api from './api';

const newsletterService = {
  subscribe: async (email, source) => {
    const { data } = await api.post('/newsletter/subscribe', { email, source });
    return data;
  },
  getSubscribers: async (params) => {
    const { data } = await api.get('/newsletter', { params });
    return data.data;
  },
  getSubscriberCount: async () => {
    const { data } = await api.get('/newsletter/count');
    return data.data;
  },
};
export default newsletterService;
