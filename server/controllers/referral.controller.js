const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Referral = require('../models/Referral');
const User = require('../models/User');
const referralService = require('../services/referralService');

const getReferralInfo = asyncHandler(async (req, res) => {
  const analytics = await referralService.getReferralAnalytics(req.user._id);
  res.json(ApiResponse.success(analytics));
});

const getTeamTree = asyncHandler(async (req, res) => {
  const depth = parseInt(req.query.depth) || 5;
  const tree = await referralService.getTeamTree(req.user._id, depth);
  res.json(ApiResponse.success(tree));
});

const getReferralEarnings = asyncHandler(async (req, res) => {
  const result = await referralService.getReferralEarnings(req.user._id, req.query);
  res.json(ApiResponse.success(result.earnings, 'Earnings fetched', result.pagination));
});

const applyReferralCode = asyncHandler(async (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) throw ApiError.badRequest('Referral code is required');

  const result = await referralService.processReferralSignup(req.user._id, referralCode);
  if (!result) throw ApiError.badRequest('Invalid or already used referral code');

  res.json(ApiResponse.success(result, 'Referral code applied'));
});

const getReferralLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await Referral.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$referrer', totalReferrals: { $sum: 1 }, totalEarned: { $sum: '$totalEarned' } } },
    { $sort: { totalReferrals: -1 } },
    { $limit: 20 },
  ]);

  await User.populate(leaderboard, { path: '_id', select: 'name email avatar' });

  const formatted = leaderboard.map(item => ({
    user: item._id,
    totalReferrals: item.totalReferrals,
    totalEarned: item.totalEarned,
  }));

  res.json(ApiResponse.success(formatted));
});

const getReferralStats = asyncHandler(async (req, res) => {
  const analytics = await referralService.getReferralAnalytics(req.user._id);
  const teamSize = await Referral.countDocuments({ referrer: req.user._id, status: 'active' });

  const levelCounts = await Referral.aggregate([
    { $match: { referrer: req.user._id, status: 'active' } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json(ApiResponse.success({
    referralCode: analytics.referralCode,
    referralLink: analytics.referralLink,
    teamSize,
    totalEarned: analytics.totalEarned,
    pendingEarnings: analytics.pendingEarnings,
    levelCounts,
  }));
});

exports.getReferralAnalytics = asyncHandler(async (req, res) => {
  const Referral = require('../models/Referral');
  const ReferralEarning = require('../models/ReferralEarning');
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const [totalReferrals, activeReferrals, totalCommission, pendingCommission, levelStats, dailySignups] = await Promise.all([
    Referral.countDocuments(),
    Referral.countDocuments({ status: 'active' }),
    ReferralEarning.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ReferralEarning.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ReferralEarning.aggregate([{ $group: { _id: '$level', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Referral.aggregate([
      { $match: { joinedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$joinedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json(ApiResponse.success({
    totalReferrals, activeReferrals, totalCommission: totalCommission[0]?.total || 0,
    pendingCommission: pendingCommission[0]?.total || 0, levelStats, dailySignups,
  }));
});

module.exports = {
  getReferralInfo,
  getTeamTree,
  getReferralEarnings,
  applyReferralCode,
  getReferralLeaderboard,
  getReferralStats,
  getReferralAnalytics: exports.getReferralAnalytics,
};
