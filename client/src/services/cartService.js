import api from './api';

const cartService = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data.data;
  },

  addItem: async (item) => {
    const { data } = await api.post('/cart/items', item);
    return data.data;
  },

  updateItem: async (productId, quantity) => {
    const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
    return data.data;
  },

  removeItem: async (productId) => {
    await api.delete(`/cart/items/${productId}`);
  },

  clearCart: async () => {
    await api.delete('/cart');
  },

  applyCoupon: async (code) => {
    const { data } = await api.post('/cart/apply-coupon', { code });
    return data.data;
  },

  removeCoupon: async () => {
    await api.delete('/cart/remove-coupon');
  },
};

export default cartService;
