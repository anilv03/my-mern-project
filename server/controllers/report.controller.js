const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getRevenueReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, 'payment.status': 'completed' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const totals = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, 'payment.status': 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: '$pricing.total' } } },
  ]);
  res.json(ApiResponse.success({ daily: data, totals: totals[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 } }));
});

exports.getProductReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, 'payment.status': 'completed' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', title: { $first: '$items.title' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
    { $sort: { quantity: -1 } },
    { $limit: 20 },
  ]);
  const categoryData = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, 'payment.status': 'completed' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.productType', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
  ]);
  res.json(ApiResponse.success({ topProducts, categoryData }));
});

exports.getUserReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const [totalUsers, newUsers, sellerCount, userByRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ role: 'seller' }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);
  const signupsDaily = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(ApiResponse.success({ totalUsers, newUsers, sellerCount, userByRole, signupsDaily }));
});

exports.getFinancialReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days*24*60*60*1000);
  const transactions = await WalletTransaction.aggregate([
    { $match: { createdAt: { $gte: since }, status: 'completed' } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const daily = await WalletTransaction.aggregate([
    { $match: { createdAt: { $gte: since }, status: 'completed' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, credits: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } }, debits: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(ApiResponse.success({ byType: transactions, daily }));
});
