import api from './api';

const wishlistService = {
  getWishlist: async () => {
    const { data } = await api.get('/wishlist');
    return data.data;
  },

  addItem: async (productId) => {
    const { data } = await api.post(`/wishlist/items/${productId}`);
    return data.data;
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/wishlist/items/${productId}`);
    return data.data;
  },

  setPriceAlert: async (productId) => {
    const { data } = await api.post(`/wishlist/items/${productId}/price-alert`);
    return data.data;
  },
};

export default wishlistService;
