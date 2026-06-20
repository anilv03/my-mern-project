import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    const { data } = await api.post('/orders', orderData);
    return data.data;
  },

  verifyPayment: async (paymentData) => {
    const { data } = await api.post('/orders/verify-payment', paymentData);
    return data.data;
  },

  buyAgain: async (orderId) => {
    const { data } = await api.post(`/orders/${orderId}/buy-again`);
    return data.data;
  },

  placeOrder: async (orderData) => {
    const { data } = await api.post('/orders/legacy', orderData);
    return data.data;
  },

  getOrders: async (params = {}) => {
    const { data } = await api.get('/orders', { params });
    return {
      orders: data.data,
      pagination: {
        page: data.meta?.page || 1,
        limit: data.meta?.limit || 10,
        totalPages: data.meta?.pages || 1,
        totalOrders: data.meta?.total || 0,
      },
    };
  },

  getOrderById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data.data;
  },

  cancelOrder: async (id, reason) => {
    const { data } = await api.patch(`/orders/${id}/cancel`, { reason });
    return data.data;
  },

  trackOrder: async (orderNumber) => {
    const { data } = await api.get(`/orders/track/${orderNumber}`);
    return data.data;
  },
};

export default orderService;
