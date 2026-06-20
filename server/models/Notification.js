const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order_placed', 'order_shipped', 'order_delivered', 'order_cancelled',
        'order_refunded', 'payment_received', 'payment_failed',
        'seller_approved', 'seller_rejected', 'seller_request',
        'product_approved', 'product_rejected', 'product_reported',
        'review_received', 'review_reply',
        'payout_processed', 'payout_failed',
        'subscription_renewed', 'subscription_expiring', 'subscription_cancelled',
        'coupon_expiring', 'low_stock',
        'welcome', 'password_changed', 'account_verified',
        'system', 'promotional', 'admin_alert',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push', 'all'],
      default: 'in_app',
    },
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
