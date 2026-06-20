const Stripe = require('stripe');

let instance = null;

const getStripe = () => {
  if (!instance && process.env.STRIPE_SECRET_KEY) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
    });
  }
  return instance;
};

module.exports = getStripe;