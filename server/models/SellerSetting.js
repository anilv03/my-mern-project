const mongoose = require('mongoose');

const sellerSettingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  general: {
    storeName: { type: String, default: '' },
    storeEmail: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeDescription: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' },
  },
  notifications: {
    newOrder: { type: Boolean, default: true },
    orderShipped: { type: Boolean, default: true },
    orderDelivered: { type: Boolean, default: true },
    orderCancelled: { type: Boolean, default: true },
    newReview: { type: Boolean, default: true },
    lowStock: { type: Boolean, default: false },
    payoutReceived: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  shipping: {
    domesticShipping: { type: Number, default: 0 },
    internationalShipping: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    handlingTime: { type: Number, default: 1 },
    defaultCarrier: { type: String, default: '' },
    returnPolicy: { type: String, default: '30_days' },
  },
  policies: {
    returnPolicyText: { type: String, default: '' },
    refundPolicyText: { type: String, default: '' },
    shippingPolicyText: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    privacyPolicy: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SellerSetting', sellerSettingSchema);
