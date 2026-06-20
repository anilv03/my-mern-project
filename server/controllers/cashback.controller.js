const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const CashbackSetting = require('../models/CashbackSetting');
const Cashback = require('../models/Cashback');
const cashbackService = require('../services/cashbackService');

const getCashbackSettings = asyncHandler(async (req, res) => {
  const settings = await CashbackSetting.findOne().sort({ createdAt: -1 });
  res.json(ApiResponse.success(settings || {}));
});

const updateCashbackSettings = asyncHandler(async (req, res) => {
  const {
    isEnabled, type, rate, maxCashback, minOrderAmount,
    applicableProductTypes, excludedCategories,
    validFrom, validUntil, autoCredit, creditDelayHours, description,
  } = req.body;

  let setting = await CashbackSetting.findOne().sort({ createdAt: -1 });
  if (!setting) {
    setting = new CashbackSetting();
  }

  if (isEnabled !== undefined) setting.isEnabled = isEnabled;
  if (type !== undefined) setting.type = type;
  if (rate !== undefined) setting.rate = rate;
  if (maxCashback !== undefined) setting.maxCashback = maxCashback;
  if (minOrderAmount !== undefined) setting.minOrderAmount = minOrderAmount;
  if (applicableProductTypes) setting.applicableProductTypes = applicableProductTypes;
  if (excludedCategories) setting.excludedCategories = excludedCategories;
  if (validFrom) setting.validFrom = validFrom;
  if (validUntil) setting.validUntil = validUntil;
  if (autoCredit !== undefined) setting.autoCredit = autoCredit;
  if (creditDelayHours !== undefined) setting.creditDelayHours = creditDelayHours;
  if (description !== undefined) setting.description = description;
  setting.updatedBy = req.user._id;

  await setting.save();
  res.json(ApiResponse.success(setting, 'Cashback settings updated'));
});

const getUserCashbacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const total = await Cashback.countDocuments(filter);
  const cashbacks = await Cashback.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('order', 'orderNumber total status')
    .lean();

  res.json(ApiResponse.success(cashbacks, 'Cashbacks fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

const getCashbackStats = asyncHandler(async (req, res) => {
  const stats = await cashbackService.getUserCashbackTotal(req.user._id);
  res.json(ApiResponse.success(stats));
});

const getAllCashbacksAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const total = await Cashback.countDocuments(filter);
  const cashbacks = await Cashback.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email')
    .populate('order', 'orderNumber total')
    .lean();

  res.json(ApiResponse.success(cashbacks, 'Cashbacks fetched', {
    page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit),
  }));
});

module.exports = {
  getCashbackSettings,
  updateCashbackSettings,
  getUserCashbacks,
  getCashbackStats,
  getAllCashbacksAdmin,
};
