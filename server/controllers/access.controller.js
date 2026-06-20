const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const { ORDER_STATUS } = require('../constants/orderStatus');

exports.checkProductAccess = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });

  const activeSub = await Subscription.findOne({
    user: req.user._id,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gte: new Date() },
  });

  const hasAccess = !!(hasPurchased || activeSub);

  res.json(ApiResponse.success({
    hasAccess,
    purchased: !!hasPurchased,
    subscribed: !!activeSub,
  }));
});

exports.getMyProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  }).populate({
    path: 'items.product',
    select: 'title slug images pricing productType digitalFile',
  });

  const productMap = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.product && !productMap[item.product._id]) {
        productMap[item.product._id] = item.product;
      }
    });
  });

  const purchased = Object.values(productMap);

  const sub = await Subscription.findOne({
    user: req.user._id,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gte: new Date() },
  }).populate('plan', 'name slug');

  res.json(ApiResponse.success({ purchased, subscription: sub }));
});
