const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const walletService = require('../services/walletService');

const getWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWalletBalance(req.user._id);
  res.json(ApiResponse.success(wallet));
});

const getTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.getTransactionHistory(req.user._id, req.query);
  res.json(ApiResponse.success(result.transactions, 'Transactions fetched', result.pagination));
});

const addMoney = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const { wallet, transaction } = await walletService.creditWallet({
    userId: req.user._id,
    amount,
    type: 'add_money',
    description: `Money added via ${paymentMethod}`,
    metadata: { paymentMethod },
  });
  res.status(201).json(ApiResponse.created({ wallet, transaction }, 'Money added successfully'));
});

const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, bankDetails, upiDetails, userNote } = req.body;

  const wallet = await walletService.getOrCreateWallet(req.user._id);
  if (wallet.balance < amount) throw ApiError.badRequest('Insufficient balance');

  const withdrawalFee = 0;
  const netAmount = amount - withdrawalFee;

  await walletService.holdWithdrawalAmount(req.user._id, amount);

  const withdrawal = await WithdrawalRequest.create({
    user: req.user._id,
    wallet: wallet._id,
    amount,
    fee: withdrawalFee,
    netAmount,
    paymentMethod,
    bankDetails: paymentMethod === 'bank_transfer' ? bankDetails : undefined,
    upiDetails: paymentMethod === 'upi' ? upiDetails : undefined,
    userNote,
  });

  res.status(201).json(ApiResponse.created(withdrawal, 'Withdrawal request submitted'));
});

const getWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const total = await WithdrawalRequest.countDocuments(filter);
  const withdrawals = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json(ApiResponse.success(withdrawals, 'Withdrawals fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

const cancelWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: 'pending',
  });
  if (!withdrawal) throw ApiError.notFound('Pending withdrawal not found');

  withdrawal.status = 'cancelled';
  await withdrawal.save();

  await walletService.releaseWithdrawalAmount(req.user._id, withdrawal.amount);

  res.json(ApiResponse.success(withdrawal, 'Withdrawal cancelled'));
});

const getAllWithdrawalsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const total = await WithdrawalRequest.countDocuments(filter);
  const withdrawals = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email')
    .lean();

  res.json(ApiResponse.success(withdrawals, 'Withdrawals fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

const processWithdrawal = asyncHandler(async (req, res) => {
  const { action, rejectionReason, adminNote, transactionId } = req.body;
  const withdrawal = await WithdrawalRequest.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal not found');
  if (withdrawal.status !== 'pending') throw ApiError.badRequest('Withdrawal already processed');

  if (action === 'approve') {
    withdrawal.status = 'completed';
    withdrawal.adminNote = adminNote;
    withdrawal.transactionId = transactionId;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user._id;
    await withdrawal.save();

    await walletService.confirmWithdrawalDeduction(withdrawal.user, withdrawal.amount);
  } else {
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = rejectionReason;
    withdrawal.adminNote = adminNote;
    withdrawal.processedBy = req.user._id;
    await withdrawal.save();

    await walletService.releaseWithdrawalAmount(withdrawal.user, withdrawal.amount);
  }

  res.json(ApiResponse.success(withdrawal, `Withdrawal ${action}d successfully`));
});

const creditUserWallet = asyncHandler(async (req, res) => {
  const { userId, amount, description } = req.body;

  const { wallet, transaction } = await walletService.creditWallet({
    userId,
    amount,
    type: 'admin_credit',
    description: description || 'Admin credit',
    metadata: { creditedBy: req.user._id },
  });

  res.json(ApiResponse.success({ wallet, transaction }, 'Wallet credited'));
});

const debitUserWallet = asyncHandler(async (req, res) => {
  const { userId, amount, description } = req.body;

  const { wallet, transaction } = await walletService.debitWallet({
    userId,
    amount,
    type: 'admin_debit',
    description: description || 'Admin debit',
    metadata: { debitedBy: req.user._id },
  });

  res.json(ApiResponse.success({ wallet, transaction }, 'Wallet debited'));
});

const getAllTransactionsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.userId) filter.user = req.query.userId;
  if (req.query.status) filter.status = req.query.status;
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter).populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);
  res.json(ApiResponse.success(transactions, 'Transactions fetched', {
    page, limit, total, pages: Math.ceil(total / limit),
  }));
});

module.exports = {
  getWallet,
  getTransactions,
  addMoney,
  requestWithdrawal,
  getWithdrawals,
  cancelWithdrawal,
  getAllWithdrawalsAdmin,
  processWithdrawal,
  creditUserWallet,
  debitUserWallet,
  getAllTransactionsAdmin,
};
