const Referral = require('../models/Referral');
const ReferralEarning = require('../models/ReferralEarning');
const User = require('../models/User');
const walletService = require('./walletService');
const { REFERRAL_LEVELS, REFERRAL_COMMISSION_TYPES, REFERRAL_REWARDS } = require('../constants/referral');
const { WALLET_TRANSACTION_TYPES } = require('../constants/wallet');
const crypto = require('crypto');
const logger = require('../utils/logger');

const generateReferralCode = (userId) => {
  const hash = crypto.createHash('md5').update(userId.toString()).digest('hex').substring(0, 6);
  return `ZLN${hash.toUpperCase()}`;
};

const getReferralLink = (referralCode) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  return `${baseUrl}/auth/register?ref=${referralCode}`;
};

const processReferralSignup = async (referredUserId, referralCode) => {
  const referrer = await User.findOne({ referralCode });
  if (!referrer) return null;

  if (referrer._id.toString() === referredUserId.toString()) return null;

  const existing = await Referral.findOne({ referred: referredUserId });
  if (existing) return null;

  const referral = await Referral.create({
    referrer: referrer._id,
    referred: referredUserId,
    level: 1,
    referralCode,
  });

  await processUplineCommissions(referrer._id, referredUserId, 1);

  return referral;
};

const processUplineCommissions = async (referrerId, referredUserId, startLevel) => {
  let currentReferrerId = referrerId;

  for (let level = startLevel; level <= 5; level++) {
    const levelConfig = REFERRAL_LEVELS.find(l => l.level === level);
    if (!levelConfig) break;

    const referral = await Referral.findOne({
      referred: currentReferrerId,
      status: 'active',
    });

    if (!referral) break;

    const uplineUser = referral.referrer;
    const existingEarning = await ReferralEarning.findOne({
      referrer: uplineUser,
      referred: referredUserId,
      level,
    });

    if (!existingEarning) {
      await ReferralEarning.create({
        referrer: uplineUser,
        referred: referredUserId,
        referral: referral._id,
        level,
        commissionType: REFERRAL_COMMISSION_TYPES.ORDER_COMMISSION,
        sourceAmount: 0,
        commissionRate: levelConfig.commissionRate,
        amount: 0,
        status: 'pending',
      });
    }

    currentReferrerId = uplineUser;
  }
};

const creditReferralCommission = async (order, referredUserId) => {
  const referrals = await Referral.find({ referred: referredUserId, status: 'active' }).populate('referrer');

  for (const referral of referrals) {
    const levelConfig = REFERRAL_LEVELS.find(l => l.level === referral.level);
    if (!levelConfig) continue;

    const commissionAmount = (order.pricing.total * levelConfig.commissionRate) / 100;
    if (commissionAmount <= 0) continue;

    let earning = await ReferralEarning.findOne({
      referrer: referral.referrer,
      referred: referredUserId,
      level: referral.level,
      commissionType: REFERRAL_COMMISSION_TYPES.ORDER_COMMISSION,
      'source.order': order._id,
    });

    if (earning) continue;

    earning = await ReferralEarning.create({
      referrer: referral.referrer,
      referred: referredUserId,
      referral: referral._id,
      level: referral.level,
      commissionType: REFERRAL_COMMISSION_TYPES.ORDER_COMMISSION,
      sourceAmount: order.pricing.total,
      commissionRate: levelConfig.commissionRate,
      amount: commissionAmount,
      source: { order: order._id, description: `Commission from order ${order.orderNumber}` },
      status: 'pending',
    });

    referral.totalEarned += commissionAmount;
    await referral.save();
  }
};

const approveReferralEarnings = async (orderId) => {
  const earnings = await ReferralEarning.find({
    'source.order': orderId,
    status: 'pending',
  });

  for (const earning of earnings) {
    try {
      await walletService.creditWallet({
        userId: earning.referrer,
        amount: earning.amount,
        type: WALLET_TRANSACTION_TYPES.REFERRAL_COMMISSION,
        description: `Referral level ${earning.level} commission`,
        reference: { order: orderId, referralEarning: earning._id },
      });

      earning.status = 'credited';
      earning.creditedAt = new Date();
      await earning.save();
    } catch (error) {
      logger.error(`Failed to credit referral earning ${earning._id}:`, error);
    }
  }
};

const creditSellerReferralCommission = async (order) => {
  if (!order.items || order.items.length === 0) return;

  const sellerMap = {};
  for (const item of order.items) {
    if (!item.seller) continue;
    const sellerId = item.seller.toString();
    sellerMap[sellerId] = (sellerMap[sellerId] || 0) + item.total;
  }

  for (const [sellerId, sellerTotal] of Object.entries(sellerMap)) {
    const referrals = await Referral.find({ referred: sellerId, status: 'active' }).populate('referrer');
    for (const referral of referrals) {
      const levelConfig = REFERRAL_LEVELS.find(l => l.level === referral.level);
      if (!levelConfig) continue;

      const commissionAmount = (sellerTotal * levelConfig.commissionRate) / 100;
      if (commissionAmount <= 0) continue;

      const existing = await ReferralEarning.findOne({
        referrer: referral.referrer, referred: sellerId, level: referral.level,
        commissionType: REFERRAL_COMMISSION_TYPES.ORDER_COMMISSION, 'source.order': order._id,
      });
      if (existing) continue;

      await ReferralEarning.create({
        referrer: referral.referrer, referred: sellerId, referral: referral._id, level: referral.level,
        commissionType: REFERRAL_COMMISSION_TYPES.ORDER_COMMISSION, sourceAmount: sellerTotal,
        commissionRate: levelConfig.commissionRate, amount: commissionAmount,
        source: { order: order._id, description: `Level ${referral.level} commission from seller sales - Order ${order.orderNumber}` },
        status: 'pending',
      });

      referral.totalEarned += commissionAmount;
      await referral.save();
    }
  }
};

const processFirstPurchaseReward = async (order, referredUserId) => {
  if (order.pricing.total < REFERRAL_REWARDS.MINIMUM_ORDER_TOTAL) return;

  const referral = await Referral.findOne({ referred: referredUserId, status: 'active' }).populate('referrer');
  if (!referral) return;

  const existingReward = await ReferralEarning.findOne({
    referrer: referral.referrer,
    referred: referredUserId,
    commissionType: REFERRAL_COMMISSION_TYPES.FIRST_PURCHASE_REWARD,
  });
  if (existingReward) return;

  await ReferralEarning.create({
    referrer: referral.referrer,
    referred: referredUserId,
    referral: referral._id,
    level: referral.level,
    commissionType: REFERRAL_COMMISSION_TYPES.FIRST_PURCHASE_REWARD,
    sourceAmount: order.pricing.total,
    commissionRate: 0,
    amount: REFERRAL_REWARDS.FIRST_PURCHASE_AMOUNT,
    source: { order: order._id, description: `First purchase reward - Order ${order.orderNumber}` },
    status: 'pending',
  });

  referral.totalEarned += REFERRAL_REWARDS.FIRST_PURCHASE_AMOUNT;
  await referral.save();
};

const approveReferralEarning = async (earningId, adminId) => {
  const earning = await ReferralEarning.findById(earningId);
  if (!earning) throw new Error('Earning not found');
  if (earning.status !== 'pending') throw new Error('Earning already processed');

  await walletService.creditWallet({
    userId: earning.referrer,
    amount: earning.amount,
    type: WALLET_TRANSACTION_TYPES.REFERRAL_COMMISSION,
    description: `Referral ${earning.commissionType} - Level ${earning.level}`,
    reference: { order: earning.source?.order, referralEarning: earning._id },
  });

  earning.status = 'credited';
  earning.creditedAt = new Date();
  earning.processedBy = adminId;
  await earning.save();

  return earning;
};

const rejectReferralEarning = async (earningId, adminId, reason) => {
  const earning = await ReferralEarning.findById(earningId);
  if (!earning) throw new Error('Earning not found');
  if (earning.status !== 'pending') throw new Error('Earning already processed');

  earning.status = 'cancelled';
  earning.processedBy = adminId;
  earning.rejectionReason = reason;
  await earning.save();

  const referral = await Referral.findById(earning.referral);
  if (referral) {
    referral.totalEarned = Math.max(0, referral.totalEarned - earning.amount);
    await referral.save();
  }

  return earning;
};

const getPendingFirstPurchaseRewards = async (query = {}) => {
  const { page = 1, limit = 20 } = query;
  const filter = { commissionType: REFERRAL_COMMISSION_TYPES.FIRST_PURCHASE_REWARD, status: 'pending' };

  const total = await ReferralEarning.countDocuments(filter);
  const rewards = await ReferralEarning.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('referrer', 'name email')
    .populate('referred', 'name email')
    .populate('source.order', 'orderNumber total status createdAt')
    .lean();

  return {
    rewards,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  };
};

const getTeamTree = async (userId, depth = 5) => {
  const tree = [];

  const getChildren = async (parentId, currentLevel) => {
    if (currentLevel > depth) return [];

    const directReferrals = await Referral.find({ referrer: parentId, status: 'active' })
      .populate('referred', 'name email avatar createdAt')
      .lean();

    const children = [];
    for (const ref of directReferrals) {
      const subTree = await getChildren(ref.referred._id, currentLevel + 1);
      children.push({
        user: ref.referred,
        level: ref.level,
        joinedAt: ref.createdAt,
        totalEarned: ref.totalEarned,
        children: subTree,
      });
    }

    return children;
  };

  const level1Referrals = await Referral.find({ referrer: userId, status: 'active' })
    .populate('referred', 'name email avatar createdAt')
    .lean();

  for (const ref of level1Referrals) {
    const subTree = await getChildren(ref.referred._id, 2);
    tree.push({
      user: ref.referred,
      level: ref.level,
      joinedAt: ref.createdAt,
      totalEarned: ref.totalEarned,
      children: subTree,
    });
  }

  return tree;
};

const getReferralAnalytics = async (userId) => {
  const totalReferrals = await Referral.countDocuments({ referrer: userId, status: 'active' });

  const levelDistribution = await Referral.aggregate([
    { $match: { referrer: userId, status: 'active' } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const totalEarnings = await ReferralEarning.aggregate([
    { $match: { referrer: userId, status: 'credited' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const pendingEarnings = await ReferralEarning.aggregate([
    { $match: { referrer: userId, status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const earningsByLevel = await ReferralEarning.aggregate([
    { $match: { referrer: userId, status: 'credited' } },
    { $group: { _id: '$level', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const recentEarnings = await ReferralEarning.find({ referrer: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('referred', 'name email')
    .lean();

  const user = await User.findById(userId);
  const referralCode = user.referralCode || (await generateReferralCode(userId));
  if (!user.referralCode) {
    user.referralCode = referralCode;
    await user.save();
  }

  return {
    referralCode,
    referralLink: getReferralLink(referralCode),
    totalReferrals,
    levelDistribution,
    totalEarned: totalEarnings[0]?.total || 0,
    pendingEarnings: pendingEarnings[0]?.total || 0,
    earningsByLevel,
    recentEarnings,
  };
};

const getReferralEarnings = async (userId, query = {}) => {
  const { page = 1, limit = 20, level, status } = query;
  const filter = { referrer: userId };

  if (level) filter.level = Number(level);
  if (status) filter.status = status;

  const total = await ReferralEarning.countDocuments(filter);
  const earnings = await ReferralEarning.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('referred', 'name email avatar')
    .populate('source.order', 'orderNumber total status')
    .lean();

  return {
    earnings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  generateReferralCode,
  getReferralLink,
  processReferralSignup,
  processUplineCommissions,
  creditReferralCommission,
  approveReferralEarnings,
  processFirstPurchaseReward,
  creditSellerReferralCommission,
  approveReferralEarning,
  rejectReferralEarning,
  getPendingFirstPurchaseRewards,
  getTeamTree,
  getReferralAnalytics,
  getReferralEarnings,
};
