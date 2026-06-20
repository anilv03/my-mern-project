import api from './api';

const flashSaleService = {
  getActiveFlashSales: async () => {
    const { data } = await api.get('/flash-sales/active');
    return data.data;
  },
  getFlashSaleBySlug: async (slug) => {
    const { data } = await api.get(`/flash-sales/${slug}`);
    return data.data;
  },
  getAllFlashSales: async (params) => {
    const { data } = await api.get('/flash-sales', { params });
    return data.data;
  },
  createFlashSale: async (saleData) => {
    const { data } = await api.post('/flash-sales', saleData);
    return data.data;
  },
  updateFlashSale: async (id, saleData) => {
    const { data } = await api.put(`/flash-sales/${id}`, saleData);
    return data.data;
  },
  deleteFlashSale: async (id) => {
    await api.delete(`/flash-sales/${id}`);
  },
};
export default flashSaleService;
