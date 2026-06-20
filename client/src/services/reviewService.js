import api from './api';

const reviewService = {
  getProductReviews: async (productId, params = {}) => {
    const { data } = await api.get(`/reviews/product/${productId}`, { params });
    return { reviews: data.data, meta: data.meta };
  },

  createReview: async (payload) => {
    const { data } = await api.post('/reviews', payload);
    return data.data;
  },

  updateReview: async (id, payload) => {
    const { data } = await api.patch(`/reviews/${id}`, payload);
    return data.data;
  },

  deleteReview: async (id) => {
    await api.delete(`/reviews/${id}`);
  },

  markHelpful: async (id) => {
    const { data } = await api.post(`/reviews/${id}/helpful`);
    return data.data;
  },
};

export default reviewService;
