const mongoose = require('mongoose');
const { CREATOR_CONTENT_TYPES, CREATOR_REWARD_STATUS_ARRAY } = require('../constants/creator');

const creatorRewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      enum: CREATOR_CONTENT_TYPES,
      required: true,
    },
    contentUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    productLink: String,
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: CREATOR_REWARD_STATUS_ARRAY,
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,
    adminNote: String,
    engagement: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

creatorRewardSchema.index({ user: 1, createdAt: -1 });
creatorRewardSchema.index({ status: 1 });
creatorRewardSchema.index({ contentType: 1 });

module.exports = mongoose.model('CreatorReward', creatorRewardSchema);
