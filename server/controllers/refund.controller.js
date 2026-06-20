const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getRefundRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { returnRequested: true };
  if (req.query.returnStatus) filter.returnStatus = req.query.returnStatus;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort('-updatedAt').skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  const stats = await Order.aggregate([
    { $match: { returnRequested: true } },
    { $group: { _id: '$returnStatus', count: { $sum: 1 } } },
  ]);
  res.json(ApiResponse.success({
    refunds: orders, stats, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.processRefund = asyncHandler(async (req, res) => {
  const { orderId, action, reason, refundAmount } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.returnRequested) throw ApiError.badRequest('No refund requested for this order');
  if (action === 'approve') {
    const amount = refundAmount || order.pricing.total;
    order.returnStatus = 'approved';
    order.status = 'refunded';
    const wallet = await Wallet.findOne({ user: order.user });
    if (wallet) {
      await WalletTransaction.create({
        user: order.user, wallet: wallet._id, type: 'order_refund',
        amount, balanceBefore: wallet.balance, balanceAfter: wallet.balance + amount,
        description: `Refund for order ${order.orderNumber}`,
        reference: { order: order._id }, status: 'completed',
      });
      wallet.balance += amount;
      wallet.totalCredited += amount;
      await wallet.save();
    }
  } else {
    order.returnStatus = 'rejected';
    order.returnReason = reason || 'Refund request rejected';
  }
  order.statusHistory.push({
    status: order.status,
    changedBy: req.user._id,
    note: `Refund ${action}: ${reason || ''}`,
  });
  await order.save();
  res.json(ApiResponse.success(order, `Refund ${action}d`));
});

exports.getRefundStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    { $match: { returnRequested: true } },
    { $group: { _id: '$returnStatus', count: { $sum: 1 }, totalAmount: { $sum: '$pricing.total' } } },
  ]);
  const totalRefunded = await Order.aggregate([
    { $match: { returnStatus: 'approved' } },
    { $group: { _id: null, total: { $sum: '$pricing.total' } } },
  ]);
  res.json(ApiResponse.success({
    byStatus: stats,
    totalRefunded: totalRefunded[0]?.total || 0,
  }));
});
