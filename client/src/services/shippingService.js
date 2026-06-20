import api from './api';

const shippingService = {
  getShipments: (params) => api.get('/shipping', { params }),
  createShipment: (data) => api.post('/shipping', data),
  getShipmentById: (id) => api.get(`/shipping/${id}`),
  trackShipment: (id) => api.get(`/shipping/${id}/track`),
  updateTracking: (id, data) => api.patch(`/shipping/${id}/track`, data),
  getLabel: (id) => api.get(`/shipping/${id}/label`),
  cancelShipment: (id) => api.delete(`/shipping/${id}`),
};

export default shippingService;
