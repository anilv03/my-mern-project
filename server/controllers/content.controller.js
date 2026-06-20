const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');
const DownloadHistory = require('../models/DownloadHistory');
const CourseProgress = require('../models/CourseProgress');
const AudioProgress = require('../models/AudioProgress');
const Cart = require('../models/Cart');
const { ORDER_STATUS } = require('../constants/orderStatus');
const { DIGITAL_PRODUCTS } = require('../constants/productTypes');
const logger = require('../utils/logger');

const CONTENT_SIGN_SECRET = process.env.JWT_ACCESS_SECRET || 'content-sign-secret';
const SIGNED_URL_EXPIRY = 5 * 60 * 1000;

const getUserPurchasedProducts = async (userId, productTypeFilter) => {
  const match = { user: userId, status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] } };
  const orders = await Order.find(match).populate({
    path: 'items.product',
    select: 'title slug images thumbnail pricing.sellingPrice productType deliveryType downloadAllowed streamOnly trackable digitalFile settings.isDownloadable',
  });
  const productMap = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.product && !productMap[item.product._id]) {
        productMap[item.product._id] = item.product;
      }
    });
  });
  let products = Object.values(productMap);
  if (productTypeFilter) {
    products = products.filter(p => productTypeFilter.includes(p.productType));
  }
  return products;
};

const getActiveSubscription = async (userId) => {
  return Subscription.findOne({
    user: userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gte: new Date() },
  }).populate('plan', 'name slug description features');
};

const generateSignedUrl = (productId, userId, fileUrl, expiresIn = SIGNED_URL_EXPIRY) => {
  const payload = {
    productId,
    userId: String(userId),
    fileUrl,
    iat: Date.now(),
    exp: Date.now() + expiresIn,
  };
  const token = jwt.sign(payload, CONTENT_SIGN_SECRET);
  return token;
};

exports.getLibrary = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const products = await getUserPurchasedProducts(req.user._id, ['ebook', 'ebook_combo']);

  const productIds = products.map(p => p._id);
  const downloadHistories = await DownloadHistory.aggregate([
    { $match: { user: req.user._id, product: { $in: productIds } } },
    { $group: { _id: '$product', count: { $sum: 1 }, lastDownload: { $max: '$createdAt' } } },
  ]);
  const downloadMap = {};
  downloadHistories.forEach(d => { downloadMap[String(d._id)] = { count: d.count, lastDownload: d.lastDownload }; });

  const enriched = products.map(product => ({
    _id: product._id,
    title: product.title,
    slug: product.slug,
    thumbnail: product.thumbnail || (product.images && product.images[0]?.url) || '',
    productType: product.productType,
    price: product.pricing?.sellingPrice,
    downloadAllowed: product.downloadAllowed !== false,
    streamOnly: product.streamOnly === true,
    fileType: product.digitalFile?.fileType,
    fileSize: product.digitalFile?.fileSize,
    downloadLimit: product.digitalFile?.downloadLimit || 0,
    downloadCount: downloadMap[String(product._id)]?.count || 0,
    lastDownload: downloadMap[String(product._id)]?.lastDownload || null,
    deliveredAt: null,
  }));

  const start = (page - 1) * limit;
  const paginated = enriched.slice(start, start + limit);
  const total = enriched.length;

  res.status(200).json(ApiResponse.success(paginated, 'Library fetched successfully', {
    page, limit, total, pages: Math.ceil(total / limit),
  }));
});

exports.getCourses = asyncHandler(async (req, res) => {
  const products = await getUserPurchasedProducts(req.user._id, ['video_course']);

  const productIds = products.map(p => p._id);
  const progressRecords = await CourseProgress.find({ user: req.user._id, product: { $in: productIds } });
  const progressMap = {};
  progressRecords.forEach(p => { progressMap[String(p.product)] = p; });

  const enriched = products.map(product => {
    const progress = progressMap[String(product._id)];
    return {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      thumbnail: product.thumbnail || (product.images && product.images[0]?.url) || '',
      productType: product.productType,
      price: product.pricing?.sellingPrice,
      totalVideos: product.digitalFile?.courseVideos?.length || 0,
      completedVideos: progress?.completedVideosCount || 0,
      completedVideosCount: progress?.completedVideosCount || 0,
      progressPercent: progress?.progressPercent || 0,
      completed: progress?.completed || false,
      lastVideoIndex: progress?.lastVideoIndex || 0,
      lastPosition: progress?.lastPosition || 0,
      lastAccessed: progress?.lastAccessed || null,
      duration: product.digitalFile?.duration || 0,
    };
  });

  res.status(200).json(ApiResponse.success(enriched, 'Courses fetched successfully'));
});

exports.getCourseDetail = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select('title slug description thumbnail images pricing.sellingPrice productType deliveryType streamOnly digitalFile');

  if (!product) throw ApiError.notFound('Course not found');
  if (product.productType !== 'video_course') throw ApiError.badRequest('Not a video course');

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  const activeSub = await getActiveSubscription(req.user._id);
  if (!hasAccess && !activeSub) throw ApiError.forbidden('You have not purchased this course');

  let progress = await CourseProgress.findOne({ user: req.user._id, product: productId });
  if (!progress) {
    progress = await CourseProgress.create({
      user: req.user._id,
      product: productId,
      totalVideos: product.digitalFile?.courseVideos?.length || 0,
    });
  }

  const videos = (product.digitalFile?.courseVideos || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((video, index) => {
      const completedVideo = progress.completedVideos.find(v => v.videoIndex === index);
      return {
        index,
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail,
        fileSize: video.fileSize,
        completed: !!completedVideo,
        completedAt: completedVideo?.completedAt || null,
        watchedSeconds: completedVideo?.watchedSeconds || 0,
        signedUrl: null,
      };
    });

  const resumeIndex = progress.lastVideoIndex || 0;

  res.status(200).json(ApiResponse.success({
    _id: product._id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    thumbnail: product.thumbnail || (product.images && product.images[0]?.url) || '',
    price: product.pricing?.sellingPrice,
    totalVideos: videos.length,
    completedVideosCount: progress.completedVideosCount,
    progressPercent: progress.progressPercent,
    completed: progress.completed,
    resumeIndex,
    lastPosition: progress.lastPosition,
    lastAccessed: progress.lastAccessed,
    videos,
    streamOnly: product.streamOnly !== false,
  }, 'Course detail fetched successfully'));
});

exports.getAudioBooks = asyncHandler(async (req, res) => {
  const products = await getUserPurchasedProducts(req.user._id, ['audiobook']);

  const productIds = products.map(p => p._id);
  const progressRecords = await AudioProgress.find({ user: req.user._id, product: { $in: productIds } });
  const progressMap = {};
  progressRecords.forEach(p => { progressMap[String(p.product)] = p; });

  const enriched = products.map(product => {
    const progress = progressMap[String(product._id)];
    return {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      thumbnail: product.thumbnail || (product.images && product.images[0]?.url) || '',
      productType: product.productType,
      price: product.pricing?.sellingPrice,
      duration: product.digitalFile?.duration || 0,
      fileType: product.digitalFile?.fileType,
      fileSize: product.digitalFile?.fileSize,
      currentPosition: progress?.currentPosition || 0,
      playbackSpeed: progress?.playbackSpeed || 1,
      completed: progress?.completed || false,
      lastListened: progress?.lastListened || null,
      totalDuration: progress?.totalDuration || 0,
    };
  });

  res.status(200).json(ApiResponse.success(enriched, 'Audio books fetched successfully'));
});

exports.getAudioBookDetail = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select('title slug description thumbnail images pricing.sellingPrice productType deliveryType digitalFile');

  if (!product) throw ApiError.notFound('Audio book not found');
  if (product.productType !== 'audiobook') throw ApiError.badRequest('Not an audio book');

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  const activeSub = await getActiveSubscription(req.user._id);
  if (!hasAccess && !activeSub) throw ApiError.forbidden('You have not purchased this audio book');

  let progress = await AudioProgress.findOne({ user: req.user._id, product: productId });
  if (!progress) {
    progress = await AudioProgress.create({
      user: req.user._id,
      product: productId,
      totalDuration: product.digitalFile?.duration || 0,
    });
  }

  progress.lastListened = new Date();
  await progress.save();

  res.status(200).json(ApiResponse.success({
    _id: product._id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    thumbnail: product.thumbnail || (product.images && product.images[0]?.url) || '',
    price: product.pricing?.sellingPrice,
    duration: product.digitalFile?.duration || 0,
    fileType: product.digitalFile?.fileType,
    fileSize: product.digitalFile?.fileSize,
    currentPosition: progress.currentPosition,
    playbackSpeed: progress.playbackSpeed,
    completed: progress.completed,
    totalDuration: progress.totalDuration,
    lastListened: progress.lastListened,
  }, 'Audio book detail fetched successfully'));
});

exports.getSubscriptionDetail = asyncHandler(async (req, res) => {
  const subscription = await getActiveSubscription(req.user._id);

  if (!subscription) {
    const expired = await Subscription.findOne({
      user: req.user._id,
      status: { $in: ['canceled', 'expired'] },
    }).sort({ createdAt: -1 }).populate('plan', 'name slug description features pricing');

    return res.status(200).json(ApiResponse.success({
      hasActive: false,
      lastSubscription: expired || null,
    }, 'No active subscription'));
  }

  const now = new Date();
  const end = new Date(subscription.currentPeriodEnd);
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((end - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysRemaining;
  const usagePercent = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;

  res.status(200).json(ApiResponse.success({
    hasActive: true,
    _id: subscription._id,
    plan: subscription.plan,
    billingInterval: subscription.billingInterval,
    price: subscription.price,
    status: subscription.status,
    autoRenew: subscription.autoRenew,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    daysRemaining,
    daysElapsed,
    totalDays,
    usagePercent,
    trialEndsAt: subscription.trialEndsAt,
    canceledAt: subscription.canceledAt,
    lastPaymentAt: subscription.lastPaymentAt,
    nextBillingAt: subscription.nextBillingAt,
  }, 'Subscription detail fetched successfully'));
});

exports.downloadContent = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select('title slug productType deliveryType downloadAllowed streamOnly digitalFile settings.isDownloadable');

  if (!product) throw ApiError.notFound('Product not found');
  if (!DIGITAL_PRODUCTS.includes(product.productType)) throw ApiError.badRequest('Not a digital product');

  const downloadableTypes = ['ebook', 'ebook_combo'];
  if (!downloadableTypes.includes(product.productType)) throw ApiError.badRequest('This content type is not downloadable');

  if (product.streamOnly || product.downloadAllowed === false) {
    throw ApiError.forbidden('This content is stream-only and cannot be downloaded');
  }

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  const activeSub = await getActiveSubscription(req.user._id);
  if (!hasAccess && !activeSub) throw ApiError.forbidden('You have not purchased this product');

  const fileUrl = product.digitalFile?.fileUrl;
  if (!fileUrl) throw ApiError.notFound('No downloadable file available for this product');

  const downloadLimit = product.digitalFile?.downloadLimit || 0;
  if (downloadLimit > 0) {
    const downloadCount = await DownloadHistory.countDocuments({ user: req.user._id, product: productId });
    if (downloadCount >= downloadLimit) {
      throw ApiError.badRequest(`Download limit of ${downloadLimit} reached`);
    }
  }

  await DownloadHistory.create({
    user: req.user._id,
    product: productId,
    order: hasAccess?._id,
    fileName: `${product.title}.${product.digitalFile?.fileType || 'pdf'}`,
    fileType: product.digitalFile?.fileType,
    fileSize: product.digitalFile?.fileSize,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  if (hasAccess) {
    const order = await Order.findById(hasAccess._id);
    if (order) {
      const item = order.items.find(i => String(i.product) === productId);
      if (item) {
        item.isDownloaded = true;
        item.downloadCount = (item.downloadCount || 0) + 1;
        await order.save();
      }
    }
  }

  const signedToken = generateSignedUrl(productId, req.user._id, fileUrl);

  res.status(200).json(ApiResponse.success({
    signedToken,
    fileUrl,
    fileName: `${product.title}.${product.digitalFile?.fileType || 'pdf'}`,
    fileType: product.digitalFile?.fileType,
    fileSize: product.digitalFile?.fileSize,
  }, 'Download ready'));
});

exports.getDownloadHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const history = await DownloadHistory.find({ user: req.user._id, product: productId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json(ApiResponse.success(history, 'Download history fetched successfully'));
});

exports.updateCourseProgress = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { videoIndex, position, duration, completed } = req.body;

  const product = await Product.findById(productId).select('productType digitalFile.courseVideos');
  if (!product) throw ApiError.notFound('Course not found');
  if (product.productType !== 'video_course') throw ApiError.badRequest('Not a video course');

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  if (!hasAccess) throw ApiError.forbidden('Not purchased');

  let progress = await CourseProgress.findOne({ user: req.user._id, product: productId });
  if (!progress) {
    progress = new CourseProgress({
      user: req.user._id,
      product: productId,
      totalVideos: product.digitalFile?.courseVideos?.length || 0,
    });
  }

  if (videoIndex !== undefined && completed) {
    const existingIdx = progress.completedVideos.findIndex(v => v.videoIndex === videoIndex);
    if (existingIdx === -1) {
      progress.completedVideos.push({
        videoIndex,
        completedAt: new Date(),
        duration: duration || 0,
        watchedSeconds: position || 0,
      });
      progress.completedVideosCount = progress.completedVideos.length;
    }
  }

  if (videoIndex !== undefined) {
    progress.lastVideoIndex = videoIndex;
  }
  if (position !== undefined) {
    progress.lastPosition = position;
  }
  if (product.digitalFile?.courseVideos) {
    progress.totalVideos = product.digitalFile.courseVideos.length;
  }

  progress.progressPercent = progress.totalVideos > 0
    ? Math.round((progress.completedVideosCount / progress.totalVideos) * 100)
    : 0;

  if (progress.progressPercent >= 100) {
    progress.completed = true;
  }

  progress.lastAccessed = new Date();
  await progress.save();

  res.status(200).json(ApiResponse.success({
    completedVideosCount: progress.completedVideosCount,
    totalVideos: progress.totalVideos,
    progressPercent: progress.progressPercent,
    completed: progress.completed,
    lastVideoIndex: progress.lastVideoIndex,
    lastPosition: progress.lastPosition,
  }, 'Progress updated'));
});

exports.updateAudioProgress = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { currentPosition, playbackSpeed, totalDuration, completed } = req.body;

  const product = await Product.findById(productId).select('productType');
  if (!product) throw ApiError.notFound('Audio book not found');
  if (product.productType !== 'audiobook') throw ApiError.badRequest('Not an audio book');

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  if (!hasAccess) throw ApiError.forbidden('Not purchased');

  let progress = await AudioProgress.findOne({ user: req.user._id, product: productId });
  if (!progress) {
    progress = new AudioProgress({ user: req.user._id, product: productId });
  }

  if (currentPosition !== undefined) progress.currentPosition = currentPosition;
  if (playbackSpeed !== undefined) progress.playbackSpeed = playbackSpeed;
  if (totalDuration !== undefined) progress.totalDuration = totalDuration;
  if (completed !== undefined) {
    progress.completed = completed;
    if (completed) progress.completedAt = new Date();
  }
  progress.lastListened = new Date();

  await progress.save();

  res.status(200).json(ApiResponse.success({
    currentPosition: progress.currentPosition,
    playbackSpeed: progress.playbackSpeed,
    completed: progress.completed,
    lastListened: progress.lastListened,
  }, 'Progress updated'));
});

exports.getSignedUrl = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { videoIndex } = req.query;

  const product = await Product.findById(productId).select('title productType deliveryType streamOnly digitalFile');
  if (!product) throw ApiError.notFound('Product not found');

  const hasAccess = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
  });
  const activeSub = await getActiveSubscription(req.user._id);
  if (!hasAccess && !activeSub) throw ApiError.forbidden('Not purchased');

  let fileUrl;
  if (product.productType === 'video_course' && videoIndex !== undefined) {
    const videos = (product.digitalFile?.courseVideos || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    const video = videos[parseInt(videoIndex)];
    if (!video) throw ApiError.notFound('Video not found');
    fileUrl = video.url;
  } else if (product.productType === 'audiobook') {
    fileUrl = product.digitalFile?.fileUrl;
    if (!fileUrl) throw ApiError.notFound('No audio file available');
  } else {
    fileUrl = product.digitalFile?.fileUrl;
    if (!fileUrl) throw ApiError.notFound('No content file available');
  }

  const signedToken = generateSignedUrl(productId, req.user._id, fileUrl);

  res.status(200).json(ApiResponse.success({
    signedToken,
    fileUrl,
    expiryMs: SIGNED_URL_EXPIRY,
  }, 'Signed URL generated'));
});

exports.verifySignedUrl = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) throw ApiError.badRequest('Token is required');

  try {
    const decoded = jwt.verify(token, CONTENT_SIGN_SECRET);
    if (decoded.exp < Date.now()) throw ApiError.unauthorized('Signed URL expired');

    const hasAccess = await Order.findOne({
      user: decoded.userId,
      'items.product': decoded.productId,
      status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
    });
    const activeSub = await getActiveSubscription(decoded.userId);
    if (!hasAccess && !activeSub) throw ApiError.forbidden('Access revoked');

    if (decoded.fileUrl) {
      return res.redirect(decoded.fileUrl);
    }

    throw ApiError.notFound('Content URL not found');
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.message === 'Signed URL expired') {
      throw ApiError.unauthorized('Signed URL has expired. Please request a new one.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid signed URL');
    }
    throw error;
  }
});

exports.renewSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Process actual payment before renewing
  // Currently only admins can renew subscriptions (bypass payment)
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Subscription renewal requires payment. Please purchase a new subscription.');
  }

  const subscription = await Subscription.findById(id).populate('plan');
  if (!subscription) throw ApiError.notFound('Subscription not found');
  if (String(subscription.user) !== String(req.user._id)) throw ApiError.forbidden('Not your subscription');

  if (subscription.plan?.billingIntervals) {
    const intervalConfig = subscription.plan.billingIntervals.find(
      bi => bi.interval === subscription.billingInterval
    );
    if (intervalConfig) subscription.price = intervalConfig.price;
  }

  const now = new Date();
  const intervalMap = {
    monthly: 30, quarterly: 90, half_yearly: 180, yearly: 365, lifetime: 36500,
  };
  const days = intervalMap[subscription.billingInterval] || 30;

  if (subscription.status === 'expired' || subscription.status === 'canceled') {
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    subscription.status = 'active';
    subscription.canceledAt = undefined;
    subscription.cancelReason = undefined;
  } else {
    const currentEnd = new Date(subscription.currentPeriodEnd);
    if (currentEnd < now) {
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      subscription.currentPeriodEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    }
    subscription.status = 'active';
  }

  subscription.autoRenew = true;
  subscription.lastPaymentAt = new Date();
  subscription.lastPaymentStatus = 'renewed';

  await subscription.save();

  res.status(200).json(ApiResponse.success(subscription, 'Subscription renewed successfully'));
});

exports.buyAgain = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select('title slug pricing.sellingPrice productType status seller');

  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'published') throw ApiError.badRequest('Product is not available');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(item => String(item.product) === productId);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + 1;
  } else {
    cart.items.push({
      product: productId,
      seller: product.seller,
      quantity: 1,
      price: product.pricing.sellingPrice,
    });
  }

  cart.coupon = undefined;
  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'title slug pricing.sellingPrice images thumbnail productType');

  res.status(200).json(ApiResponse.success(updatedCart, 'Item added to cart'));
});
