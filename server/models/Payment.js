const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../constants/orderStatus');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
      webhookEvent: String,
      webhookTimestamp: Date,
    },
    stripe: {
      paymentIntentId: String,
      clientSecret: String,
      chargeId: String,
      receiptUrl: String,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    refund: {
      amount: { type: Number, default: 0 },
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
      },
      initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      initiatedAt: Date,
      processedAt: Date,
      gatewayRefundId: String,
    },
    metadata: {
      ip: String,
      userAgent: String,
      paymentSource: String,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ 'razorpay.orderId': 1 });
paymentSchema.index({ 'stripe.paymentIntentId': 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
