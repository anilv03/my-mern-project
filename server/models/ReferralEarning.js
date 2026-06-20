const mongoose = require('mongoose');
const { REFERRAL_COMMISSION_TYPES_ARRAY } = require('../constants/referral');

const referralEarningSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    commissionType: {
      type: String,
      enum: REFERRAL_COMMISSION_TYPES_ARRAY,
      default: 'order_commission',
    },
    sourceAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      description: String,
    },
    status: {
      type: String,
      enum: ['pending', 'credited', 'cancelled'],
      default: 'pending',
    },
    creditedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

referralEarningSchema.index({ referrer: 1, createdAt: -1 });
referralEarningSchema.index({ referred: 1 });
referralEarningSchema.index({ level: 1 });

module.exports = mongoose.model('ReferralEarning', referralEarningSchema);
