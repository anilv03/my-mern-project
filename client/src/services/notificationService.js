import api from './api';

const notificationService = {
  getAll: async () => {
    const { data } = await api.get('/notifications');
    return data.data;
  },

  markAsRead: async (id) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },

  markAllAsRead: async () => {
    await api.patch('/notifications/read-all');
  },

  deleteOne: async (id) => {
    await api.delete(`/notifications/${id}`);
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data.data;
  },
};

export default notificationService;
