import api from './api';

const chatService = {
  getChats: () => api.get('/chats'),
  getOrCreateChat: (data) => api.post('/chats', data),
  getChatById: (id) => api.get(`/chats/${id}`),
  getMessages: (id, page = 1) => api.get(`/chats/${id}/messages`, { params: { page, limit: 50 } }),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
  markAsRead: (chatId) => api.patch(`/chats/${chatId}/read`),
  deleteMessage: (chatId, messageId) => api.delete(`/chats/${chatId}/messages/${messageId}`),
};

export default chatService;
