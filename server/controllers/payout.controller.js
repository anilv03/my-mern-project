const Payout = require('../models/Payout');
const SellerProfile = require('../models/SellerProfile');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllPayouts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [payouts, total] = await Promise.all([
    Payout.find(filter).populate('seller', 'name email storeName').sort('-createdAt').skip(skip).limit(limit),
    Payout.countDocuments(filter),
  ]);
  const stats = await Payout.aggregate([
    { $group: { _id: '$status', total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
  ]);
  res.json(ApiResponse.success({
    payouts, stats, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getPayoutById = asyncHandler(async (req, res) => {
  const payout = await Payout.findById(req.params.id).populate('seller', 'name email');
  if (!payout) throw ApiError.notFound('Payout not found');
  res.json(ApiResponse.success(payout));
});

exports.createPayout = asyncHandler(async (req, res) => {
  const { seller, amount, periodStart, periodEnd, notes } = req.body;
  const wallet = await Wallet.findOne({ user: seller });
  if (!wallet || wallet.balance < amount) throw ApiError.badRequest('Insufficient balance');
  const sellerProfile = await SellerProfile.findOne({ user: seller });
  const commissionRate = sellerProfile?.commissionRate || 10;
  const commissionDeducted = amount * (commissionRate / 100);
  const netAmount = amount - commissionDeducted;
  const payout = await Payout.create({
    seller, amount, commissionDeducted, netAmount, periodStart, periodEnd,
    status: 'pending', initiatedBy: req.user._id, notes,
  });
  res.status(201).json(ApiResponse.created(payout, 'Payout created'));
});

exports.processPayout = asyncHandler(async (req, res) => {
  const { status, transactionReference, gatewayResponse, adminNote } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw ApiError.notFound('Payout not found');
  payout.status = status;
  payout.adminNote = adminNote;
  payout.approvedBy = req.user._id;
  if (status === 'processing') payout.processedAt = new Date();
  if (status === 'completed') {
    payout.completedAt = new Date();
    payout.transactionReference = transactionReference;
    payout.gatewayResponse = gatewayResponse;
    const wallet = await Wallet.findOne({ user: payout.seller });
    if (wallet) {
      const tx = await WalletTransaction.create({
        user: payout.seller, wallet: wallet._id, type: 'withdrawal',
        amount: -payout.netAmount, description: `Payout settled: ${payout._id}`,
        reference: { payout: payout._id }, status: 'completed',
      });
    }
  }
  await payout.save();
  res.json(ApiResponse.success(payout, `Payout ${status}`));
});

exports.getSettlementSummary = asyncHandler(async (req, res) => {
  const stats = await Payout.aggregate([
    { $group: { _id: null, totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$netAmount', 0] } }, totalPending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, '$netAmount', 0] } }, count: { $sum: 1 } } },
  ]);
  const sellersPending = await SellerProfile.countDocuments({ balance: { $gt: 0 } });
  res.json(ApiResponse.success({
    totalPaid: stats[0]?.totalPaid || 0,
    totalPending: stats[0]?.totalPending || 0,
    totalPayouts: stats[0]?.count || 0,
    sellersPending,
  }));
});
