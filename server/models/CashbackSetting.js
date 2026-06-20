const mongoose = require('mongoose');
const { CASHBACK_TYPE_ARRAY } = require('../constants/cashback');

const cashbackSettingSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: CASHBACK_TYPE_ARRAY,
      default: 'percentage',
    },
    rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    maxCashback: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    applicableProductTypes: [
      {
        type: String,
      },
    ],
    excludedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    validFrom: Date,
    validUntil: Date,
    autoCredit: {
      type: Boolean,
      default: true,
    },
    creditDelayHours: {
      type: Number,
      default: 0,
    },
    description: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CashbackSetting', cashbackSettingSchema);
