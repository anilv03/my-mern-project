const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', 'lifetime'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'expired', 'past_due', 'trialing'],
      default: 'active',
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialEndsAt: Date,
    canceledAt: Date,
    cancelReason: String,
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe'],
    },
    gatewaySubscriptionId: String,
    gatewayPaymentId: String,
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lastPaymentAt: Date,
    lastPaymentStatus: String,
    nextBillingAt: Date,
    usage: {
      downloadsUsed: { type: Number, default: 0 },
      downloadLimit: { type: Number, default: 0 },
      devicesLoggedIn: { type: Number, default: 0 },
    },
    metadata: {},
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
