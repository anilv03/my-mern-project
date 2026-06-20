const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    type: {
      type: String,
      enum: [
        'payment_capture', 'payment_refund', 'payment_failure',
        'payout', 'payout_failure', 'commission_deduction',
        'subscription_charge', 'subscription_refund',
        'wallet_credit', 'wallet_debit',
        'order_cancellation', 'order_return',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'system'],
    },
    gatewayTransactionId: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'cancelled'],
      required: true,
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

transactionLogSchema.index({ user: 1, createdAt: -1 });
transactionLogSchema.index({ order: 1 });
transactionLogSchema.index({ type: 1 });
transactionLogSchema.index({ gatewayTransactionId: 1 });
transactionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
