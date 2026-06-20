const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const SellerProfile = require('../models/SellerProfile');
const SellerSetting = require('../models/SellerSetting');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Payout = require('../models/Payout');
const FlashSale = require('../models/FlashSale');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const walletService = require('../services/walletService');

exports.getDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
  const [totalProducts, totalOrders, totalRevenue, recentOrders, monthlyRevenue] = await Promise.all([
    Product.countDocuments({ seller: sellerId }),
    Order.countDocuments({ 'items.seller': sellerId }),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, 'payment.status': 'completed' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $group: { _id: null, total: { $sum: '$items.sellerEarning' } } },
    ]),
    Order.find({ 'items.seller': sellerId }).sort('-createdAt').limit(5).select('orderNumber totalAmount status createdAt'),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, createdAt: { $gte: thirtyDaysAgo }, 'payment.status': 'completed' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$items.sellerEarning' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const totalEarning = totalRevenue[0]?.total || 0;
  res.json(ApiResponse.success({
    totalProducts,
    totalOrders,
    totalRevenue: totalEarning,
    totalEarnings: totalEarning,
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      createdAt: o.createdAt,
      total: o.totalAmount || 0,
      status: o.status,
    })),
    revenueChart: monthlyRevenue.map((d) => ({
      date: d._id,
      label: new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: d.revenue,
    })),
  }));
});

exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const filter = { seller: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [products, total] = await Promise.all([
    Product.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    products, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { 'items.seller': req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getEarnings = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const [pipeline, wallet, payouts, totalOrders] = await Promise.all([
    Order.aggregate([
      { $match: { 'items.seller': sellerId, 'payment.status': 'completed' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $group: { _id: null, totalEarnings: { $sum: '$items.sellerEarning' }, totalSales: { $sum: '$items.quantity' }, orderCount: { $addToSet: '$_id' } } },
    ]),
    Wallet.findOne({ user: sellerId }),
    Payout.find({ seller: sellerId }).sort('-createdAt').limit(10),
    Order.countDocuments({ 'items.seller': sellerId, 'payment.status': 'completed' }),
  ]);
  const stats = pipeline[0] || { totalEarnings: 0, totalSales: 0, orderCount: [] };
  res.json(ApiResponse.success({
    totalEarnings: stats.totalEarnings,
    totalSales: stats.totalSales,
    totalOrders: stats.orderCount.length || totalOrders,
    walletBalance: wallet?.balance || 0,
    payouts,
  }));
});

exports.getReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
  const productIds = sellerProducts.map(p => p._id);
  const [reviews, total] = await Promise.all([
    Review.find({ product: { $in: productIds } }).populate('user', 'name avatar').populate('product', 'title slug images').sort('-createdAt').skip(skip).limit(limit),
    Review.countDocuments({ product: { $in: productIds } }),
  ]);
  res.json(ApiResponse.success({
    reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getProfile = asyncHandler(async (req, res) => {
  let profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await SellerProfile.create({ user: req.user._id, storeName: `${req.user.name}'s Store`, storeSlug: `store-${req.user._id.toString().slice(-8)}`, contactEmail: req.user.email });
  }
  res.json(ApiResponse.success(profile));
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOneAndUpdate({ user: req.user._id }, req.body, { new: true, runValidators: true });
  if (!profile) throw ApiError.notFound('Seller profile not found');
  res.json(ApiResponse.success(profile, 'Profile updated'));
});

exports.getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet) throw ApiError.notFound('Wallet not found');

  const pendingCount = await Order.countDocuments({
    'items.seller': req.user._id,
    'items.settlementStatus': 'pending',
    'items.deliveryStatus': 'delivered',
  });

  res.json(ApiResponse.success({
    ...wallet.toObject(),
    pendingSettlements: wallet.pendingSettlements || 0,
    pendingSettlementsCount: pendingCount,
  }));
});

exports.getWithdrawals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(limit),
    WithdrawalRequest.countDocuments({ user: req.user._id }),
  ]);
  res.json(ApiResponse.success({
    withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, bankDetails, upiDetails } = req.body;
  let wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet || wallet.balance < amount) throw ApiError.badRequest('Insufficient balance');
  const balanceBefore = wallet.balance;
  const fee = Math.min(amount * 0.02, 50);
  const withdrawal = await WithdrawalRequest.create({
    user: req.user._id, wallet: wallet._id, amount, fee, netAmount: amount - fee,
    paymentMethod: paymentMethod || 'bank_transfer',
    bankDetails: paymentMethod === 'bank_transfer' ? bankDetails : undefined,
    upiDetails: paymentMethod === 'upi' ? upiDetails : undefined,
    status: 'pending',
  });

  wallet = await walletService.holdWithdrawalAmount(req.user._id, amount);

  await WalletTransaction.create({
    user: req.user._id,
    wallet: wallet._id,
    type: 'withdrawal',
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description: `Withdrawal of ${amount} requested`,
    reference: { withdrawal: withdrawal._id },
    status: 'pending',
  });

  res.status(201).json(ApiResponse.created(withdrawal, 'Withdrawal requested'));
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const [totalViews, totalSales, revenueData, topProducts, categoryBreakdown] = await Promise.all([
    Product.aggregate([{ $match: { seller: sellerId } }, { $group: { _id: null, total: { $sum: '$viewCount' } } }]),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, createdAt: { $gte: since }, 'payment.status': 'completed' } },
      { $unwind: '$items' }, { $match: { 'items.seller': sellerId } },
      { $group: { _id: null, count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.sellerEarning' } } },
    ]),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, createdAt: { $gte: since }, 'payment.status': 'completed' } },
      { $unwind: '$items' }, { $match: { 'items.seller': sellerId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$items.sellerEarning' } } },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ seller: sellerId }).sort('-sales').limit(5).select('title slug images pricing sales'),
    Product.aggregate([
      { $match: { seller: sellerId } },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$cat.name', count: { $sum: 1 }, sales: { $sum: '$sales' } } },
    ]),
  ]);
  res.json(ApiResponse.success({
    totalViews: totalViews[0]?.total || 0,
    totalSales: totalSales[0]?.count || 0,
    totalRevenue: totalSales[0]?.revenue || 0,
    revenueChart: revenueData,
    topProducts,
    categoryBreakdown,
  }));
});

exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await SellerSetting.findOne({ user: req.user._id });
  if (!settings) {
    settings = await SellerSetting.create({ user: req.user._id });
  }
  res.json(ApiResponse.success(settings));
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await SellerSetting.findOneAndUpdate(
    { user: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true, upsert: true }
  );
  res.json(ApiResponse.success(settings, 'Settings updated'));
});

exports.getSellerFlashSales = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const sellerProducts = await Product.find({ seller: sellerId }).select('_id');
  const productIds = sellerProducts.map(p => p._id);
  const filter = {
    $or: [
      { createdBy: sellerId },
      { 'products.product': { $in: productIds } },
    ],
  };
  const [sales, total] = await Promise.all([
    FlashSale.find(filter)
      .populate('products.product', 'title slug images pricing')
      .sort('-createdAt').skip(skip).limit(limit),
    FlashSale.countDocuments(filter),
  ]);
  const now = new Date();
  const salesWithStatus = sales.map(s => {
    const sObj = s.toObject();
    sObj.status = (!sObj.isActive || now < new Date(sObj.startTime)) ? 'inactive'
      : now > new Date(sObj.endTime) ? 'ended'
      : 'active';
    sObj.isOwner = String(s.createdBy) === String(sellerId);
    return sObj;
  });
  const stats = {
    active: salesWithStatus.filter(s => s.status === 'active' && s.isOwner).length,
    upcoming: salesWithStatus.filter(s => s.status === 'inactive' && s.isOwner && new Date(s.startTime) > now).length,
    ended: salesWithStatus.filter(s => s.status === 'ended' && s.isOwner).length,
  };
  res.json(ApiResponse.success({
    sales: salesWithStatus, stats,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.createSellerFlashSale = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const { title, description, banner, startTime, endTime, productEntries, isFeatured, sortOrder } = req.body;
  if (!title || !startTime || !endTime || !productEntries?.length) {
    throw ApiError.badRequest('Title, start time, end time, and at least one product are required');
  }
  const productIds = productEntries.map(p => p.productId);
  const sellerProducts = await Product.find({ _id: { $in: productIds }, seller: sellerId }).select('_id pricing');
  if (sellerProducts.length !== productIds.length) {
    throw ApiError.badRequest('One or more products do not belong to you or do not exist');
  }
  const priceMap = {};
  sellerProducts.forEach(p => { priceMap[String(p._id)] = p.pricing; });
  const products = productEntries.map(entry => {
    const pricing = priceMap[entry.productId];
    const originalPrice = pricing.sellingPrice;
    const salePrice = entry.salePrice || originalPrice;
    const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    return {
      product: entry.productId,
      salePrice,
      discountPercent: entry.discountPercent || discountPercent,
      quantity: entry.quantity || 10,
      maxPerUser: entry.maxPerUser || 1,
    };
  });
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const sale = await FlashSale.create({
    title, slug, description, banner, startTime, endTime, isFeatured, sortOrder,
    products, createdBy: sellerId,
  });
  res.status(201).json(ApiResponse.created(sale, 'Flash sale created'));
});

exports.updateSellerFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  if (String(sale.createdBy) !== String(req.user._id)) throw ApiError.forbidden('Not your flash sale');
  const updates = {};
  ['title', 'description', 'banner', 'startTime', 'endTime', 'isFeatured', 'sortOrder'].forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  if (req.body.productEntries?.length) {
    const productIds = req.body.productEntries.map(p => p.productId);
    const sellerProducts = await Product.find({ _id: { $in: productIds }, seller: req.user._id }).select('_id pricing');
    if (sellerProducts.length !== productIds.length) {
      throw ApiError.badRequest('One or more products do not belong to you');
    }
    const priceMap = {};
    sellerProducts.forEach(p => { priceMap[String(p._id)] = p.pricing; });
    updates.products = req.body.productEntries.map(entry => {
      const pricing = priceMap[entry.productId];
      const originalPrice = pricing.sellingPrice;
      const salePrice = entry.salePrice || originalPrice;
      const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
      return {
        product: entry.productId,
        salePrice,
        discountPercent: entry.discountPercent || discountPercent,
        quantity: entry.quantity || 10,
        maxPerUser: entry.maxPerUser || 1,
      };
    });
  }
  const updated = await FlashSale.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json(ApiResponse.success(updated, 'Flash sale updated'));
});

exports.toggleSellerFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  if (String(sale.createdBy) !== String(req.user._id)) throw ApiError.forbidden('Not your flash sale');
  sale.isActive = !sale.isActive;
  await sale.save();
  res.json(ApiResponse.success(sale, `Flash sale ${sale.isActive ? 'activated' : 'deactivated'}`));
});

exports.deleteSellerFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  if (String(sale.createdBy) !== String(req.user._id)) throw ApiError.forbidden('Not your flash sale');
  await FlashSale.findByIdAndDelete(req.params.id);
  res.json(ApiResponse.success(null, 'Flash sale deleted'));
});

exports.getReferrals = asyncHandler(async (req, res) => {
  const Referral = require('../models/Referral');
  const ReferralEarning = require('../models/ReferralEarning');
  const User = require('../models/User');
  const referralService = require('../services/referralService');
  const { REFERRAL_LEVELS } = require('../constants/referral');

  const totalReferred = await Referral.countDocuments({ referrer: req.user._id, status: 'active' });
  const totalCommission = await ReferralEarning.aggregate([
    { $match: { referrer: req.user._id, status: 'credited' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const pendingCommission = await ReferralEarning.aggregate([
    { $match: { referrer: req.user._id, status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const user = await User.findById(req.user._id);
  const referralCode = user.referralCode || referralService.generateReferralCode(req.user._id);
  const referralLink = referralService.getReferralLink(referralCode);
  if (!user.referralCode) {
    user.referralCode = referralCode;
    await user.save();
  }

  const earnings = await ReferralEarning.find({ referrer: req.user._id })
    .populate('referred', 'name email avatar')
    .sort('-createdAt')
    .limit(20)
    .lean();

  const earningsByLevel = await ReferralEarning.aggregate([
    { $match: { referrer: req.user._id, status: 'credited' } },
    { $group: { _id: '$level', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json(ApiResponse.success({
    totalReferred,
    totalCommission: totalCommission[0]?.total || 0,
    pendingCommission: pendingCommission[0]?.total || 0,
    referralCode,
    referralLink,
    levels: REFERRAL_LEVELS,
    earningsByLevel,
    earnings,
  }));
});

exports.getSellerReferrals = exports.getReferrals;
