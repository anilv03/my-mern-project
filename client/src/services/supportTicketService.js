import api from './api';

const supportTicketService = {
  getTickets: async (params = {}) => {
    const { data } = await api.get('/seller/tickets', { params });
    return data;
  },

  getTicketById: async (id) => {
    const { data } = await api.get(`/seller/tickets/${id}`);
    return data.data;
  },

  createTicket: async (ticketData) => {
    const { data } = await api.post('/seller/tickets', ticketData);
    return data.data;
  },

  addReply: async (id, message) => {
    const { data } = await api.post(`/seller/tickets/${id}/reply`, { message });
    return data.data;
  },

  closeTicket: async (id) => {
    const { data } = await api.patch(`/seller/tickets/${id}/close`);
    return data.data;
  },

  reopenTicket: async (id) => {
    const { data } = await api.patch(`/seller/tickets/${id}/reopen`);
    return data.data;
  },
};

export default supportTicketService;
