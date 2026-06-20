const CreatorRewardSetting = require('../models/CreatorRewardSetting');
const CreatorReward = require('../models/CreatorReward');
const walletService = require('./walletService');
const { WALLET_TRANSACTION_TYPES } = require('../constants/wallet');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const getActiveRewardSetting = async () => {
  return CreatorRewardSetting.findOne({ isEnabled: true }).sort({ createdAt: -1 }).lean();
};

const getRewardAmountForContentType = async (contentType) => {
  const setting = await getActiveRewardSetting();
  if (!setting) return 0;

  const rate = setting.rewardRates?.find(r => r.contentType === contentType);
  return rate?.rewardAmount || 0;
};

const approveReward = async (rewardId, adminId, adminNote = '') => {
  const reward = await CreatorReward.findById(rewardId);
  if (!reward) throw ApiError.notFound('Creator reward not found');
  if (reward.status !== 'pending') throw ApiError.badRequest('Reward is already processed');

  const amount = await getRewardAmountForContentType(reward.contentType);
  if (amount <= 0) throw ApiError.badRequest('No reward configured for this content type');

  reward.rewardAmount = amount;
  reward.status = 'approved';
  reward.reviewedBy = adminId;
  reward.reviewedAt = new Date();
  reward.adminNote = adminNote;
  await reward.save();

  try {
    await walletService.creditWallet({
      userId: reward.user,
      amount,
      type: WALLET_TRANSACTION_TYPES.CREATOR_REWARD,
      description: `Creator reward for ${reward.contentType}`,
      reference: { creatorReward: reward._id },
    });
  } catch (error) {
    logger.error(`Failed to credit creator reward ${reward._id}:`, error);
  }

  return reward;
};

const rejectReward = async (rewardId, adminId, rejectionReason) => {
  const reward = await CreatorReward.findById(rewardId);
  if (!reward) throw ApiError.notFound('Creator reward not found');
  if (reward.status !== 'pending') throw ApiError.badRequest('Reward is already processed');

  reward.status = 'rejected';
  reward.reviewedBy = adminId;
  reward.reviewedAt = new Date();
  reward.rejectionReason = rejectionReason;
  await reward.save();

  return reward;
};

const getUserRewardStats = async (userId) => {
  const stats = await CreatorReward.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$rewardAmount' },
      },
    },
  ]);

  const totalApproved = stats.find(s => s._id === 'approved');
  const totalPending = stats.find(s => s._id === 'pending');
  const totalRejected = stats.find(s => s._id === 'rejected');

  return {
    totalApproved: totalApproved?.count || 0,
    totalApprovedAmount: totalApproved?.totalAmount || 0,
    totalPending: totalPending?.count || 0,
    totalRejected: totalRejected?.count || 0,
  };
};

module.exports = {
  getActiveRewardSetting,
  getRewardAmountForContentType,
  approveReward,
  rejectReward,
  getUserRewardStats,
};
