const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create', 'update', 'delete', 'login', 'logout',
        'password_change', 'status_change', 'approve', 'reject',
        'refund', 'payout', 'bulk_action', 'export', 'import',
      ],
    },
    resource: {
      type: {
        type: String,
        enum: ['user', 'product', 'order', 'payment', 'payout',
               'category', 'coupon', 'subscription', 'review',
               'seller', 'settings', 'system'],
        required: true,
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    description: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ip: String,
    userAgent: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
