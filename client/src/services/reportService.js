import api from './api';

const reportService = {
  getRevenueReport: async (params) => {
    const { data } = await api.get('/reports/revenue', { params });
    return data.data;
  },
  getProductReport: async (params) => {
    const { data } = await api.get('/reports/products', { params });
    return data.data;
  },
  getUserReport: async (params) => {
    const { data } = await api.get('/reports/users', { params });
    return data.data;
  },
  getFinancialReport: async (params) => {
    const { data } = await api.get('/reports/financial', { params });
    return data.data;
  },
};
export default reportService;
