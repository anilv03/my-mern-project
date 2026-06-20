const mongoose = require('mongoose');
const { CREATOR_CONTENT_TYPES } = require('../constants/creator');

const rewardRateSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: CREATOR_CONTENT_TYPES,
    required: true,
  },
  rewardAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  minViews: {
    type: Number,
    default: 0,
  },
  minEngagement: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const creatorRewardSettingSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    rewardRates: [rewardRateSchema],
    maxRewardsPerMonth: {
      type: Number,
      default: 0,
    },
    autoApprove: {
      type: Boolean,
      default: false,
    },
    requireProductLink: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('CreatorRewardSetting', creatorRewardSettingSchema);
