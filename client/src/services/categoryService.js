import api from './api';

const categoryService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/categories', { params });
    return data;
  },

  getTree: async () => {
    const { data } = await api.get('/categories/tree');
    return data.data;
  },

  getBySlug: async (slug) => {
    const { data } = await api.get(`/categories/${slug}`);
    return data.data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/categories/id/${id}`);
    return data.data;
  },

  getCategoryProducts: async (slug, params = {}) => {
    const { data } = await api.get(`/categories/${slug}/products`, { params });
    return data;
  },

  create: async (categoryData) => {
    const { data } = await api.post('/categories', categoryData);
    return data.data;
  },

  update: async (id, categoryData) => {
    const { data } = await api.put(`/categories/${id}`, categoryData);
    return data.data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export default categoryService;
