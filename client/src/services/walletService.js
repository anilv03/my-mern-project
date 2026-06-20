import api from './api';

const walletService = {
  getWallet: async () => {
    const { data } = await api.get('/wallet');
    return data.data;
  },

  getTransactions: async (params = {}) => {
    const { data } = await api.get('/wallet/transactions', { params });
    return data;
  },

  addMoney: async (amount, paymentMethod) => {
    const { data } = await api.post('/wallet/add-money', { amount, paymentMethod });
    return data.data;
  },

  requestWithdrawal: async (withdrawalData) => {
    const { data } = await api.post('/wallet/withdraw', withdrawalData);
    return data.data;
  },

  getWithdrawals: async (params = {}) => {
    const { data } = await api.get('/wallet/withdrawals', { params });
    return data;
  },

  cancelWithdrawal: async (id) => {
    const { data } = await api.put(`/wallet/withdrawals/${id}/cancel`);
    return data.data;
  },
};

export default walletService;
