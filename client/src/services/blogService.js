import api from './api';

const blogService = {
  getPublishedBlogs: async (params) => {
    const { data } = await api.get('/blogs/published', { params });
    return data.data;
  },
  getBlogBySlug: async (slug) => {
    const { data } = await api.get(`/blogs/${slug}`);
    return data.data;
  },
  getFeaturedBlogs: async () => {
    const { data } = await api.get('/blogs/featured');
    return data.data;
  },
  getBlogCategories: async () => {
    const { data } = await api.get('/blogs/categories');
    return data.data;
  },
  getMyBlogs: async (params) => {
    const { data } = await api.get('/blogs/my', { params });
    return data.data;
  },
  getBlogById: async (id) => {
    const { data } = await api.get(`/blogs/id/${id}`);
    return data.data;
  },
  getAllBlogs: async (params) => {
    const { data } = await api.get('/blogs', { params });
    return data.data;
  },
  createBlog: async (blogData) => {
    const { data } = await api.post('/blogs', blogData);
    return data.data;
  },
  updateBlog: async (id, blogData) => {
    const { data } = await api.put(`/blogs/${id}`, blogData);
    return data.data;
  },
  deleteBlog: async (id) => {
    await api.delete(`/blogs/${id}`);
  },
  addComment: async (id, comment) => {
    const { data } = await api.post(`/blogs/${id}/comments`, { comment });
    return data.data;
  },
};
export default blogService;
