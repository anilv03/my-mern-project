import api from './api';

const paymentService = {
  createRazorpayOrder: async (data) => {
    const res = await api.post('/payments/razorpay/create-order', data);
    return res.data.data;
  },

  verifyRazorpayPayment: async (data) => {
    const res = await api.post('/payments/razorpay/verify', data);
    return res.data.data;
  },

  createStripePaymentIntent: async (data) => {
    const res = await api.post('/payments/stripe/create-payment-intent', data);
    return res.data.data;
  },

  verifyStripePayment: async (data) => {
    const res = await api.post('/payments/stripe/verify', data);
    return res.data.data;
  },

  processRefund: async (paymentId, amount, reason) => {
    const res = await api.post('/payments/refund', { paymentId, amount, reason });
    return res.data.data;
  },
};

export default paymentService;
