const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort('sortOrder');
  res.json(ApiResponse.success(plans));
});

exports.getMySubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id, status: { $in: ['active', 'trialing', 'past_due'] } })
    .populate('plan', 'name slug features pricing');
  if (!sub) return res.json(ApiResponse.success(null, 'No active subscription'));
  res.json(ApiResponse.success(sub));
});

exports.subscribe = asyncHandler(async (req, res) => {
  const { planId, billingInterval, paymentMethod, paymentId } = req.body;
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');
  const existing = await Subscription.findOne({ user: req.user._id, status: { $in: ['active', 'trialing'] } });
  if (existing) throw ApiError.badRequest('Already have an active subscription');
  const price = plan.pricing[billingInterval];
  if (!price) throw ApiError.badRequest('Invalid billing interval');
  const sub = await Subscription.create({
    user: req.user._id,
    plan: planId,
    billingInterval,
    price,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + getIntervalMs(billingInterval)),
    lastPaymentAt: new Date(),
    lastPaymentStatus: 'completed',
    paymentMethod,
    gatewayPaymentId: paymentId,
  });
  res.status(201).json(ApiResponse.created(sub, 'Subscribed successfully'));
});

exports.cancelSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id, _id: req.params.id });
  if (!sub) throw ApiError.notFound('Subscription not found');
  sub.status = 'canceled';
  sub.canceledAt = new Date();
  sub.cancelReason = req.body.reason;
  sub.autoRenew = false;
  await sub.save();
  res.json(ApiResponse.success(sub, 'Subscription cancelled'));
});

exports.renewSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id, _id: req.params.id });
  if (!sub) throw ApiError.notFound('Subscription not found');
  sub.status = 'active';
  sub.canceledAt = undefined;
  sub.autoRenew = true;
  sub.currentPeriodStart = new Date();
  sub.currentPeriodEnd = new Date(Date.now() + getIntervalMs(sub.billingInterval));
  await sub.save();
  res.json(ApiResponse.success(sub, 'Subscription renewed'));
});

// Admin
exports.getAllSubscriptions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const [subs, total] = await Promise.all([
    Subscription.find().populate('user', 'name email').populate('plan', 'name slug').sort('-createdAt').skip(skip).limit(limit),
    Subscription.countDocuments(),
  ]);
  res.json(ApiResponse.success({
    subscriptions: subs, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

function getIntervalMs(interval) {
  const map = { monthly: 30*24*60*60*1000, quarterly: 90*24*60*60*1000, half_yearly: 182*24*60*60*1000, yearly: 365*24*60*60*1000, lifetime: 100*365*24*60*60*1000 };
  return map[interval] || 30*24*60*60*1000;
}

// Plan management (admin)
exports.createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  res.status(201).json(ApiResponse.created(plan, 'Plan created'));
});
exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!plan) throw ApiError.notFound('Plan not found');
  res.json(ApiResponse.success(plan, 'Plan updated'));
});
exports.deletePlan = asyncHandler(async (req, res) => {
  await SubscriptionPlan.findByIdAndDelete(req.params.id);
  res.json(ApiResponse.success(null, 'Plan deleted'));
});
