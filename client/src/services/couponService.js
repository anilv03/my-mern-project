import api from './api';

const couponService = {
  getCoupons: async (params = {}) => {
    const { data } = await api.get('/seller/coupons', { params });
    return data;
  },

  getCouponById: async (id) => {
    const { data } = await api.get(`/seller/coupons/${id}`);
    return data.data;
  },

  createCoupon: async (couponData) => {
    const { data } = await api.post('/seller/coupons', couponData);
    return data.data;
  },

  updateCoupon: async (id, couponData) => {
    const { data } = await api.put(`/seller/coupons/${id}`, couponData);
    return data.data;
  },

  deleteCoupon: async (id) => {
    await api.delete(`/seller/coupons/${id}`);
  },

  toggleCouponStatus: async (id) => {
    const { data } = await api.patch(`/seller/coupons/${id}/toggle`);
    return data.data;
  },

  validateCoupon: async (code, cartTotal) => {
    const { data } = await api.post('/coupons/validate', { code, cartTotal });
    return data.data;
  },
};

export default couponService;
