const Newsletter = require('../models/Newsletter');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
      return res.json(ApiResponse.success(null, 'Subscription reactivated'));
    }
    return res.json(ApiResponse.success(null, 'Already subscribed'));
  }
  await Newsletter.create({ email, source: source || 'homepage' });
  res.status(201).json(ApiResponse.created(null, 'Subscribed successfully'));
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const sub = await Newsletter.findOne({ email });
  if (!sub) throw ApiError.notFound('Email not found');
  sub.isActive = false;
  sub.unsubscribedAt = new Date();
  await sub.save();
  res.json(ApiResponse.success(null, 'Unsubscribed successfully'));
});

exports.getAllSubscribers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  const [subs, total] = await Promise.all([
    Newsletter.find(filter).sort('-subscribedAt').skip(skip).limit(limit),
    Newsletter.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    subscribers: subs, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getSubscriberCount = asyncHandler(async (req, res) => {
  const total = await Newsletter.countDocuments({ isActive: true });
  res.json(ApiResponse.success({ total }));
});
