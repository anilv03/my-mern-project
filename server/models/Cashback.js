const mongoose = require('mongoose');
const { CASHBACK_STATUS_ARRAY, CASHBACK_TYPE_ARRAY } = require('../constants/cashback');

const cashbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    type: {
      type: String,
      enum: CASHBACK_TYPE_ARRAY,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    maxCashback: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: CASHBACK_STATUS_ARRAY,
      default: 'pending',
    },
    creditedAt: Date,
    expiresAt: Date,
    source: {
      type: String,
      enum: ['order_cashback', 'special_offer', 'festive_offer', 'admin_granted'],
      default: 'order_cashback',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

cashbackSchema.index({ user: 1, status: 1 });
cashbackSchema.index({ order: 1 });

module.exports = mongoose.model('Cashback', cashbackSchema);
