const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const createReview = asyncHandler(async (req, res) => {
  const { product: productId, rating, title, comment, images } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  const isSeller = String(product.seller) === String(userId);
  const skipPurchaseCheck = isAdmin || isSeller;

  let orderId = null;
  let isVerified = false;
  if (!skipPurchaseCheck) {
    const hasOrdered = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] },
    });
    if (!hasOrdered) {
      throw ApiError.badRequest('You can only review products you have purchased and received');
    }
    orderId = hasOrdered._id;
    isVerified = true;
  }

  const review = await Review.create({
    product: productId,
    user: userId,
    order: orderId,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase: isVerified,
  });

  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length > 0) {
    const s = stats[0];
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(s.average * 10) / 10,
      'ratings.count': s.count,
      'ratings.distribution': { 1: s.dist1, 2: s.dist2, 3: s.dist3, 4: s.dist4, 5: s.dist5 },
    });
  }

  res.status(201).json(ApiResponse.created(review, 'Review created successfully'));
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 20, sort = 'newest' } = req.query;

  const filter = { product: productId, isApproved: true };

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'highest') sortOption = { rating: -1 };
  if (sort === 'lowest') sortOption = { rating: 1 };
  if (sort === 'helpful') sortOption = { helpfulCount: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);

  const product = await Product.findById(productId).select('ratings');

  res.status(200).json(
    ApiResponse.success(reviews, 'Reviews fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      ratings: product?.ratings || null,
    })
  );
});

const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('product', 'title slug images pricing.sellingPrice'),
    Review.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json(
    ApiResponse.success(reviews, 'Your reviews fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, images } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.user) !== String(userId)) {
    throw ApiError.forbidden('You can only edit your own reviews');
  }

  review.editHistory.push({
    rating: review.rating,
    comment: review.comment,
    editedAt: new Date(),
  });

  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;
  review.isEdited = true;

  await review.save();

  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length > 0) {
    const s = stats[0];
    await Product.findByIdAndUpdate(review.product, {
      'ratings.average': Math.round(s.average * 10) / 10,
      'ratings.count': s.count,
      'ratings.distribution': { 1: s.dist1, 2: s.dist2, 3: s.dist3, 4: s.dist4, 5: s.dist5 },
    });
  }

  res.status(200).json(ApiResponse.success(review, 'Review updated successfully'));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  const isOwner = String(review.user) === String(userId);
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Not authorized to delete this review');
  }

  const productId = review.product;
  await Review.findByIdAndDelete(id);

  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length > 0) {
    const s = stats[0];
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(s.average * 10) / 10,
      'ratings.count': s.count,
      'ratings.distribution': { 1: s.dist1, 2: s.dist2, 3: s.dist3, 4: s.dist4, 5: s.dist5 },
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': 0,
      'ratings.count': 0,
      'ratings.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }

  res.status(200).json(ApiResponse.success(null, 'Review deleted successfully'));
});

const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  const alreadyMarked = review.helpfulUsers.some(
    (uid) => String(uid) === String(userId)
  );

  if (alreadyMarked) {
    review.helpfulUsers.pull(userId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulUsers.push(userId);
    review.helpfulCount += 1;
  }

  await review.save();

  res.status(200).json(
    ApiResponse.success(
      { helpfulCount: review.helpfulCount, isHelpful: !alreadyMarked },
      alreadyMarked ? 'Removed helpful mark' : 'Marked as helpful'
    )
  );
});

const sellerReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user._id;

  if (!comment || !comment.trim()) {
    throw ApiError.badRequest('Reply comment is required');
  }

  const review = await Review.findById(id).populate('product', 'seller');
  if (!review) throw ApiError.notFound('Review not found');

  if (String(review.product.seller) !== String(userId)) {
    throw ApiError.forbidden('Only the product seller can reply to this review');
  }

  review.sellerReply = {
    comment: comment.trim(),
    repliedAt: new Date(),
  };

  await review.save();

  res.status(200).json(ApiResponse.success(review, 'Seller reply added successfully'));
});

const approveReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  review.isApproved = !review.isApproved;
  await review.save();

  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length > 0) {
    const s = stats[0];
    await Product.findByIdAndUpdate(review.product, {
      'ratings.average': Math.round(s.average * 10) / 10,
      'ratings.count': s.count,
      'ratings.distribution': { 1: s.dist1, 2: s.dist2, 3: s.dist3, 4: s.dist4, 5: s.dist5 },
    });
  } else {
    await Product.findByIdAndUpdate(review.product, {
      'ratings.average': 0,
      'ratings.count': 0,
      'ratings.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }

  res.status(200).json(
    ApiResponse.success(review, `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully`)
  );
});

const reportReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason || !reason.trim()) {
    throw ApiError.badRequest('Report reason is required');
  }

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  review.reportedAsInappropriate = true;
  review.reportReason = reason.trim();
  review.reportedBy = userId;

  await review.save();

  res.status(200).json(ApiResponse.success(review, 'Review reported successfully'));
});

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  markHelpful,
  sellerReply,
  approveReview,
  reportReview,
};
