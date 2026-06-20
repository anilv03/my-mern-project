const CashbackSetting = require('../models/CashbackSetting');
const Cashback = require('../models/Cashback');
const Order = require('../models/Order');
const walletService = require('./walletService');
const { WALLET_TRANSACTION_TYPES } = require('../constants/wallet');
const logger = require('../utils/logger');

const getActiveCashbackSetting = async () => {
  const setting = await CashbackSetting.findOne({ isEnabled: true })
    .sort({ createdAt: -1 })
    .lean();
  return setting;
};

const calculateCashback = async (order) => {
  const setting = await getActiveCashbackSetting();
  if (!setting) return 0;

  const now = new Date();
  if (setting.validFrom && now < setting.validFrom) return 0;
  if (setting.validUntil && now > setting.validUntil) return 0;

  if (setting.minOrderAmount > 0 && order.pricing.total < setting.minOrderAmount) return 0;

  if (setting.excludedCategories?.length > 0) {
    const hasExcluded = order.items.some(item => {
      return setting.excludedCategories.some(catId =>
        catId.toString() === (item.category?.toString() || '')
      );
    });
    if (hasExcluded) return 0;
  }

  let cashbackAmount = 0;
  if (setting.type === 'percentage') {
    cashbackAmount = (order.pricing.total * setting.rate) / 100;
    if (setting.maxCashback > 0) {
      cashbackAmount = Math.min(cashbackAmount, setting.maxCashback);
    }
  } else {
    cashbackAmount = setting.rate;
  }

  return Math.round(cashbackAmount * 100) / 100;
};

const createCashbackRecord = async (order) => {
  const setting = await getActiveCashbackSetting();
  if (!setting) return null;

  const amount = await calculateCashback(order);
  if (amount <= 0) return null;

  const cashback = await Cashback.create({
    user: order.user,
    order: order._id,
    type: setting.type,
    rate: setting.rate,
    amount,
    maxCashback: setting.maxCashback,
    status: 'pending',
    source: 'order_cashback',
  });

  return cashback;
};

const creditCashback = async (orderId) => {
  const cashbacks = await Cashback.find({ order: orderId, status: 'pending' });
  const credited = [];

  for (const cashback of cashbacks) {
    try {
      await walletService.creditWallet({
        userId: cashback.user,
        amount: cashback.amount,
        type: WALLET_TRANSACTION_TYPES.CASHBACK_CREDIT,
        description: `Cashback credited for order`,
        reference: { order: orderId, cashback: cashback._id },
      });

      cashback.status = 'credited';
      cashback.creditedAt = new Date();
      await cashback.save();
      credited.push(cashback);
    } catch (error) {
      logger.error(`Failed to credit cashback ${cashback._id}:`, error);
    }
  }

  return credited;
};

const getUserCashbackTotal = async (userId) => {
  const result = await Cashback.aggregate([
    { $match: { user: userId, status: 'credited' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return result[0] || { total: 0, count: 0 };
};

const getOrderCashback = async (orderId) => {
  return Cashback.find({ order: orderId }).lean();
};

module.exports = {
  getActiveCashbackSetting,
  calculateCashback,
  createCashbackRecord,
  creditCashback,
  getUserCashbackTotal,
  getOrderCashback,
};
