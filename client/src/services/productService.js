import api from './api';

const productService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getBySlug: async (slug) => {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data.data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  },

  getFeatured: async () => {
    const { data } = await api.get('/products/featured');
    return data.data;
  },

  getBestSellers: async () => {
    const { data } = await api.get('/products/best-sellers');
    return data.data;
  },

  getNewArrivals: async () => {
    const { data } = await api.get('/products/new-arrivals');
    return data.data;
  },

  getBySeller: async (sellerId, params = {}) => {
    const { data } = await api.get(`/products/seller/${sellerId}`, { params });
    return data;
  },

  getRelated: async (id) => {
    const { data } = await api.get(`/products/${id}/related`);
    return data.data;
  },

  create: async (productData) => {
    const { data } = await api.post('/products', productData);
    return data.data;
  },

  update: async (id, productData) => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data.data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  submitForReview: async (id) => {
    const { data } = await api.patch(`/products/${id}/submit`);
    return data.data;
  },

  approve: async (id) => {
    const { data } = await api.patch(`/products/${id}/approve`);
    return data.data;
  },

  reject: async (id, reason) => {
    const { data } = await api.patch(`/products/${id}/reject`, { reason });
    return data.data;
  },

  search: async (query, params = {}) => {
    const { data } = await api.get('/products', { params: { q: query, ...params } });
    return data;
  },
};

export default productService;
