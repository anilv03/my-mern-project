const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const CreatorReward = require('../models/CreatorReward');
const CreatorRewardSetting = require('../models/CreatorRewardSetting');
const creatorRewardService = require('../services/creatorRewardService');

const submitContent = asyncHandler(async (req, res) => {
  const { contentType, contentUrl, thumbnailUrl, title, description, productLink, product } = req.body;

  const setting = await creatorRewardService.getActiveRewardSetting();
  if (!setting || !setting.isEnabled) throw ApiError.badRequest('Creator reward program is currently disabled');

  const monthlyCount = await CreatorReward.countDocuments({
    user: req.user._id,
    createdAt: { $gte: new Date(new Date().setDate(1)) },
  });

  if (setting.maxRewardsPerMonth > 0 && monthlyCount >= setting.maxRewardsPerMonth) {
    throw ApiError.badRequest('Monthly reward limit reached');
  }

  const reward = await CreatorReward.create({
    user: req.user._id,
    contentType,
    contentUrl,
    thumbnailUrl,
    title,
    description,
    productLink,
    product,
    status: 'pending',
  });

  res.status(201).json(ApiResponse.created(reward, 'Content submitted for review'));
});

const getUserRewards = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const total = await CreatorReward.countDocuments(filter);
  const rewards = await CreatorReward.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('product', 'title slug')
    .lean();

  res.json(ApiResponse.success(rewards, 'Rewards fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

const getRewardStats = asyncHandler(async (req, res) => {
  const stats = await creatorRewardService.getUserRewardStats(req.user._id);
  res.json(ApiResponse.success(stats));
});

const getAllRewardsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, contentType } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (contentType) filter.contentType = contentType;

  const total = await CreatorReward.countDocuments(filter);
  const rewards = await CreatorReward.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email')
    .populate('product', 'title slug')
    .lean();

  res.json(ApiResponse.success(rewards, 'Rewards fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

const reviewReward = asyncHandler(async (req, res) => {
  const { action, rejectionReason, adminNote } = req.body;

  if (action === 'approve') {
    const reward = await creatorRewardService.approveReward(req.params.id, req.user._id, adminNote);
    res.json(ApiResponse.success(reward, 'Reward approved'));
  } else {
    const reward = await creatorRewardService.rejectReward(req.params.id, req.user._id, rejectionReason);
    res.json(ApiResponse.success(reward, 'Reward rejected'));
  }
});

const getRewardSettings = asyncHandler(async (req, res) => {
  const settings = await CreatorRewardSetting.findOne().sort({ createdAt: -1 });
  res.json(ApiResponse.success(settings || {}));
});

const updateRewardSettings = asyncHandler(async (req, res) => {
  const { isEnabled, rewardRates, maxRewardsPerMonth, autoApprove, requireProductLink, description } = req.body;

  let settings = await CreatorRewardSetting.findOne().sort({ createdAt: -1 });
  if (!settings) {
    settings = new CreatorRewardSetting();
  }

  if (isEnabled !== undefined) settings.isEnabled = isEnabled;
  if (rewardRates) settings.rewardRates = rewardRates;
  if (maxRewardsPerMonth !== undefined) settings.maxRewardsPerMonth = maxRewardsPerMonth;
  if (autoApprove !== undefined) settings.autoApprove = autoApprove;
  if (requireProductLink !== undefined) settings.requireProductLink = requireProductLink;
  if (description !== undefined) settings.description = description;
  settings.updatedBy = req.user._id;

  await settings.save();
  res.json(ApiResponse.success(settings, 'Reward settings updated'));
});

module.exports = {
  submitContent,
  getUserRewards,
  getRewardStats,
  getAllRewardsAdmin,
  reviewReward,
  getRewardSettings,
  updateRewardSettings,
};
