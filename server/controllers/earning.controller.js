const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const walletService = require('../services/walletService');
const cashbackService = require('../services/cashbackService');
const referralService = require('../services/referralService');
const creatorRewardService = require('../services/creatorRewardService');

const getEarningDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [wallet, cashbackStats, referralAnalytics, creatorStats] = await Promise.all([
    walletService.getWalletBalance(userId),
    cashbackService.getUserCashbackTotal(userId),
    referralService.getReferralAnalytics(userId),
    creatorRewardService.getUserRewardStats(userId),
  ]);

  res.json(ApiResponse.success({
    wallet: {
      balance: wallet.balance,
      totalCredited: wallet.totalCredited,
      totalWithdrawn: wallet.totalWithdrawn,
      pendingWithdrawal: wallet.pendingWithdrawal,
    },
    cashback: cashbackStats,
    referral: {
      totalEarned: referralAnalytics.totalEarned,
      pendingEarnings: referralAnalytics.pendingEarnings,
      totalReferrals: referralAnalytics.totalReferrals,
      referralLink: referralAnalytics.referralLink,
    },
    creatorRewards: creatorStats,
  }));
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.getTransactionHistory(req.user._id, req.query);
  res.json(ApiResponse.success(result.transactions, 'Transactions fetched', result.pagination));
});

module.exports = {
  getEarningDashboard,
  getAllTransactions,
};
