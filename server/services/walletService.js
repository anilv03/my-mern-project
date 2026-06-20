const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
};

const creditWallet = async ({ userId, amount, type, description, reference = {}, metadata = {} }) => {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');

  const wallet = await getOrCreateWallet(userId);
  const balanceBefore = wallet.balance;

  wallet.balance += amount;
  wallet.totalCredited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();

  const transaction = await WalletTransaction.create({
    user: userId,
    wallet: wallet._id,
    type,
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    reference,
    metadata,
    status: 'completed',
  });

  return { wallet, transaction };
};

const debitWallet = async ({ userId, amount, type, description, reference = {}, metadata = {} }) => {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');

  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < amount) throw ApiError.badRequest('Insufficient wallet balance');

  const balanceBefore = wallet.balance;

  wallet.balance -= amount;
  wallet.totalDebited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();

  const transaction = await WalletTransaction.create({
    user: userId,
    wallet: wallet._id,
    type,
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    reference,
    metadata,
    status: 'completed',
  });

  return { wallet, transaction };
};

const getWalletBalance = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet;
};

const getTransactionHistory = async (userId, query = {}) => {
  const { page = 1, limit = 20, type, startDate, endDate } = query;
  const filter = { user: userId };

  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await WalletTransaction.countDocuments(filter);
  const transactions = await WalletTransaction.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('reference.order', 'orderNumber total status')
    .populate('reference.withdrawal', 'amount status')
    .lean();

  return {
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const holdWithdrawalAmount = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < amount) throw ApiError.badRequest('Insufficient balance');
  wallet.balance -= amount;
  wallet.pendingWithdrawal += amount;
  await wallet.save();
  return wallet;
};

const releaseWithdrawalAmount = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  wallet.pendingWithdrawal -= amount;
  wallet.balance += amount;
  await wallet.save();
  return wallet;
};

const confirmWithdrawalDeduction = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  wallet.pendingWithdrawal -= amount;
  wallet.totalWithdrawn += amount;
  wallet.totalDebited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();
  return wallet;
};

const holdSettlementAmount = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  wallet.pendingSettlements = (wallet.pendingSettlements || 0) + amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();
  return wallet;
};

const confirmSettlementCredit = async (userId, amount) => {
  const wallet = await getOrCreateWallet(userId);
  wallet.pendingSettlements = Math.max(0, (wallet.pendingSettlements || 0) - amount);
  wallet.balance += amount;
  wallet.totalCredited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();
  return wallet;
};

module.exports = {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  getWalletBalance,
  getTransactionHistory,
  holdWithdrawalAmount,
  releaseWithdrawalAmount,
  confirmWithdrawalDeduction,
  holdSettlementAmount,
  confirmSettlementCredit,
};
