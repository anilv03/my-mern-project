import api from './api';

const subscriptionService = {
  getPlans: async () => {
    const { data } = await api.get('/subscriptions/plans');
    return data.data;
  },

  getMySubscription: async () => {
    const { data } = await api.get('/subscriptions/my');
    return data.data;
  },

  subscribe: async ({ planId, billingInterval, paymentMethod, paymentId }) => {
    const { data } = await api.post('/subscriptions/subscribe', { planId, billingInterval, paymentMethod, paymentId });
    return data.data;
  },

  cancelSubscription: async (id, reason) => {
    const { data } = await api.patch(`/subscriptions/${id}/cancel`, { reason });
    return data.data;
  },

  renewSubscription: async (id) => {
    const { data } = await api.patch(`/subscriptions/${id}/renew`);
    return data.data;
  },

  checkProductAccess: async (productId) => {
    const { data } = await api.get(`/access/check/${productId}`);
    return data.data;
  },

  getMyProducts: async () => {
    const { data } = await api.get('/access/my-products');
    return data.data;
  },
};

export default subscriptionService;
