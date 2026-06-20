const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code, description, discountType, discountValue, maxDiscount,
    minOrderAmount, usageLimit, usageLimitPerUser,
    isActive, isGlobal, seller, applicableProducts,
    applicableCategories, applicableProductTypes, excludedProducts,
    validFrom, validUntil,
  } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) throw ApiError.conflict('Coupon code already exists');

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    maxDiscount,
    minOrderAmount,
    usageLimit,
    usageLimitPerUser,
    isActive,
    isGlobal,
    seller,
    applicableProducts,
    applicableCategories,
    applicableProductTypes,
    excludedProducts,
    validFrom,
    validUntil,
    createdBy: req.user._id,
  });

  res.status(201).json(ApiResponse.created(coupon, 'Coupon created successfully'));
});

const getCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive, isGlobal, seller } = req.query;
  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isGlobal !== undefined) filter.isGlobal = isGlobal === 'true';
  if (seller) filter.seller = seller;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    Coupon.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(coupons, 'Coupons fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!coupon) throw ApiError.notFound('Coupon not found');

  res.status(200).json(ApiResponse.success(coupon, 'Coupon fetched successfully'));
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');

  const updates = { ...req.body };
  if (updates.code) {
    updates.code = updates.code.toUpperCase();
    const existing = await Coupon.findOne({ code: updates.code, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Coupon code already exists');
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(ApiResponse.success(updatedCoupon, 'Coupon updated successfully'));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');

  await Coupon.findByIdAndDelete(req.params.id);

  res.status(200).json(ApiResponse.success(null, 'Coupon deleted successfully'));
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal, productIds = [], categoryIds = [], productTypes = [] } = req.body;
  const userId = req.user._id;

  if (!code) throw ApiError.badRequest('Coupon code is required');

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw ApiError.notFound('Coupon not found or invalid');

  const now = new Date();

  if (!coupon.isActive) {
    throw ApiError.badRequest('This coupon is no longer active');
  }

  if (now < new Date(coupon.validFrom)) {
    throw ApiError.badRequest('This coupon is not yet valid');
  }

  if (now > new Date(coupon.validUntil)) {
    throw ApiError.badRequest('This coupon has expired');
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  if (coupon.usageLimitPerUser > 0) {
    const user = await User.findById(userId).select('_id');
    const usageCount = await Coupon.aggregate([
      { $match: { _id: coupon._id } },
      { $unwind: '$usedBy' },
      { $match: { 'usedBy.user': userId } },
      { $group: { _id: '$usedBy.user', count: { $sum: '$usedBy.count' } } },
    ]);

    const userUsedCount = usageCount.length > 0 ? usageCount[0].count : 0;
    if (userUsedCount >= coupon.usageLimitPerUser) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  if (coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(
      `Minimum order amount of ${coupon.minOrderAmount} is required for this coupon`
    );
  }

  if (coupon.applicableProducts.length > 0 && productIds.length > 0) {
    const valid = productIds.some((pid) =>
      coupon.applicableProducts.some((ap) => String(ap) === pid)
    );
    if (!valid) {
      throw ApiError.badRequest('This coupon does not apply to any products in your cart');
    }
  }

  if (coupon.excludedProducts.length > 0 && productIds.length > 0) {
    const excluded = productIds.some((pid) =>
      coupon.excludedProducts.some((ep) => String(ep) === pid)
    );
    if (excluded) {
      throw ApiError.badRequest('This coupon cannot be applied to some products in your cart');
    }
  }

  if (coupon.applicableCategories.length > 0 && categoryIds.length > 0) {
    const valid = categoryIds.some((cid) =>
      coupon.applicableCategories.some((ac) => String(ac) === cid)
    );
    if (!valid) {
      throw ApiError.badRequest('This coupon does not apply to any categories in your cart');
    }
  }

  if (coupon.applicableProductTypes.length > 0 && productTypes.length > 0) {
    const valid = productTypes.some((pt) => coupon.applicableProductTypes.includes(pt));
    if (!valid) {
      throw ApiError.badRequest('This coupon does not apply to the product types in your cart');
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  res.status(200).json(
    ApiResponse.success({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
        description: coupon.description,
      },
      cartTotal,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalTotal: Math.round((cartTotal - discountAmount) * 100) / 100,
    }, 'Coupon is valid')
  );
});

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
