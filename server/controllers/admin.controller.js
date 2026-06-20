const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS } = require('../constants/orderStatus');
const referralService = require('../services/referralService');
const walletService = require('../services/walletService');
const WalletTransaction = require('../models/WalletTransaction');
const Referral = require('../models/Referral');
const ReferralEarning = require('../models/ReferralEarning');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Payout = require('../models/Payout');
const logger = require('../utils/logger');

const statsCache = { data: null, lastFetched: 0 };

const getCachedSellerStats = async () => {
  const now = Date.now();
  if (statsCache.data && now - statsCache.lastFetched < 300000) return statsCache.data;
  const statsResult = await User.aggregate([
    { $match: { role: 'seller', sellerStatus: { $ne: 'suspended' } } },
    { $group: { _id: '$sellerStatus', count: { $sum: 1 } } },
  ]);
  statsCache.data = statsResult;
  statsCache.lastFetched = now;
  return statsResult;
};

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    revenueResult,
    pendingApprovals,
    ordersByStatus,
    revenueByMonth,
    topProducts,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { 'payment.status': 'captured' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    User.countDocuments({ sellerStatus: 'pending' }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { 'payment.status': 'captured', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Product.find().sort({ 'sales.count': -1 }).limit(5).select('title images pricing sales'),
    Order.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email')
      .select('orderNumber totalAmount status createdAt'),
    User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email role createdAt'),
  ]);

  const ordersByStatusMap = {};
  for (const s of Object.values(ORDER_STATUS)) ordersByStatusMap[s] = 0;
  for (const item of ordersByStatus) ordersByStatusMap[item._id] = item.count;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dashboard = {
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    pendingApprovals,
    ordersByStatus: ordersByStatusMap,
    revenueData: revenueByMonth.map((item) => ({
      label: monthNames[item._id.month - 1] || `${item._id.month}/${item._id.year}`,
      month: monthNames[item._id.month - 1] || '',
      revenue: item.revenue,
      orders: item.count,
    })),
    revenueByMonth: revenueByMonth.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      revenue: item.revenue,
      orders: item.count,
    })),
    topProducts: topProducts.map((p) => ({
      _id: p._id,
      title: p.title,
      sales: p.sales?.count ?? p.sales ?? 0,
      revenue: p.pricing?.sellingPrice || 0,
      price: p.pricing?.sellingPrice || 0,
    })),
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      user: o.user ? { name: o.user.name } : undefined,
      customerName: o.user?.name,
      createdAt: o.createdAt,
      total: o.totalAmount || 0,
      status: o.status,
    })),
    recentUsers: recentUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })),
  };

  res.json(ApiResponse.success(dashboard, 'Dashboard fetched successfully'));
});

const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken -emailOtp -phoneOtp -passwordResetToken')
      .populate('sellerProfile', 'storeName verificationStatus')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(users, 'Users fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, isActive, isVerified } = req.body;

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;

  await user.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'update',
    resource: { type: 'user', id: user._id },
    description: `User ${user.name} updated by admin`,
    changes: { before: {}, after: { role, isActive, isVerified } },
    ip: req.ip,
  });

  res.json(ApiResponse.success(user, 'User updated successfully'));
});

const getSellers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sellerStatus, kycStatus, search } = req.query;
  const filter = { role: 'seller' };

  if (sellerStatus) filter.sellerStatus = sellerStatus;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken -emailOtp -phoneOtp -passwordResetToken -recentlyViewed -wishlist')
      .populate('sellerProfile', 'storeName storeSlug storeLogo storeBanner verificationStatus commissionRate contactEmail contactPhone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  const sellers = users.map((user) => {
    const u = user.toObject({ virtuals: true });
    u.status = u.sellerStatus;
    if (u.kyc) {
      const kyc = u.kyc;
      kyc.pan = kyc.panCard?.number;
      kyc.panUrl = kyc.panCard?.url;
      kyc.aadhaarNumber = kyc.aadhaarCard?.number;
      kyc.aadhaarFrontUrl = kyc.aadhaarCard?.frontUrl;
      kyc.aadhaarBackUrl = kyc.aadhaarCard?.backUrl;
      kyc.gst = kyc.gst?.number;
      kyc.gstUrl = kyc.gst?.url;
      kyc.status = u.sellerStatus === 'approved' ? 'verified' : u.sellerStatus;
      kyc.document = kyc.panCard?.url ? { url: kyc.panCard.url } : undefined;
      kyc.selfie = kyc.selfie?.url ? { url: kyc.selfie.url } : undefined;
      delete kyc.panCard;
      delete kyc.aadhaarCard;
      delete kyc.gst;
      delete kyc.address;
    }
    return u;
  });

  res.json(
    ApiResponse.success(sellers, 'Sellers fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const approveSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, commissionRate, reason } = req.body;

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  if (status === 'rejected') {
    user.sellerStatus = 'rejected';
    user.isSellerApproved = false;
    user.sellerRejectionReason = reason || '';
    await user.save();
    await ActivityLog.create({ user: req.user._id, action: 'reject', resource: { type: 'seller', id: user._id }, description: `Seller ${user.name} rejected`, ip: req.ip });
    return res.json(ApiResponse.success({ user }, 'Seller rejected'));
  }

  if (status === 'suspended') {
    user.sellerStatus = 'suspended';
    user.isSellerApproved = false;
    await user.save();
    await ActivityLog.create({ user: req.user._id, action: 'suspend', resource: { type: 'seller', id: user._id }, description: `Seller ${user.name} suspended`, ip: req.ip });
    return res.json(ApiResponse.success({ user }, 'Seller suspended'));
  }

  if (user.sellerStatus === 'approved') {
    throw ApiError.conflict('Seller is already approved');
  }

  user.sellerStatus = 'approved';
  user.isSellerApproved = true;
  user.sellerApprovedAt = new Date();
  if (user.kyc) user.kyc.verifiedAt = new Date();
  if (user.role === 'customer') {
    user.role = 'seller';
  }
  await user.save();

  let sellerProfile = await SellerProfile.findOne({ user: id });
  if (!sellerProfile) {
    const storeName = user.kyc?.legalName || user.name || 'Unknown Store';
    const storeSlug =
      storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
      '-' +
      id.toString().slice(-6);

    sellerProfile = await SellerProfile.create({
      user: id,
      storeName,
      storeSlug,
      contactEmail: user.email,
      contactPhone: user.phone,
      verificationStatus: 'verified',
      commissionRate: commissionRate || parseFloat(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 10,
    });
  } else {
    sellerProfile.verificationStatus = 'verified';
    if (commissionRate) sellerProfile.commissionRate = commissionRate;
    await sellerProfile.save();
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'approve',
    resource: { type: 'seller', id: user._id },
    description: `Seller ${user.name} approved`,
    ip: req.ip,
  });

  res.json(ApiResponse.success({ user, sellerProfile }, 'Seller approved successfully'));
});

const mapKycStatus = (sellerStatus) => {
  if (sellerStatus === 'approved') return 'verified';
  return sellerStatus || 'pending';
};

const getSellerVerifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = { role: 'seller' };

  if (status) {
    if (status === 'verified') filter.sellerStatus = 'approved';
    else filter.sellerStatus = status;
  } else {
    filter.sellerStatus = { $ne: 'suspended' };
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { 'kyc.legalName': { $regex: escaped, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total, statsResult] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken -emailOtp -phoneOtp -passwordResetToken -recentlyViewed -wishlist')
      .populate('sellerProfile', 'storeName verificationStatus')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
    getCachedSellerStats(),
  ]);

  const stats = { pending: 0, under_review: 0, verified: 0, rejected: 0 };
  statsResult.forEach(s => {
    const key = s._id === 'approved' ? 'verified' : s._id;
    if (stats[key] !== undefined) stats[key] = s.count;
  });

  const verifications = users.map(user => {
    const kyc = user.kyc || {};
    const address = kyc.address || {};
    return {
      _id: user._id,
      sellerId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      store: user.sellerProfile ? { name: user.sellerProfile.storeName } : undefined,
      kyc: {
        _id: user._id,
        legalName: kyc.legalName,
        fathersName: kyc.fathersName,
        age: kyc.age,
        pan: kyc.panCard?.number,
        panUrl: kyc.panCard?.url,
        aadhaarNumber: kyc.aadhaarCard?.number,
        aadhaarFrontUrl: kyc.aadhaarCard?.frontUrl,
        aadhaarBackUrl: kyc.aadhaarCard?.backUrl,
        gst: kyc.gst?.number,
        gstUrl: kyc.gst?.url,
        status: mapKycStatus(user.sellerStatus),
        submittedAt: kyc.submittedAt,
        createdAt: user.createdAt,
        selfie: kyc.selfie?.url ? { url: kyc.selfie.url } : undefined,
        document: kyc.panCard?.url ? { url: kyc.panCard.url } : undefined,
        address: address.street || address.city || address.state || address.zip
          ? { street: address.street, city: address.city, state: address.state, zip: address.zip, country: address.country }
          : undefined,
        phone: kyc.phone || user.phone,
        emailVerified: kyc.emailVerified,
        phoneVerified: kyc.phoneVerified,
      },
    };
  });

  res.json(ApiResponse.success({
    verifications,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  }, 'Verifications fetched'));
});

const getSellerVerificationById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshToken -emailOtp -phoneOtp -passwordResetToken -recentlyViewed -wishlist')
    .populate('sellerProfile', 'storeName verificationStatus');

  if (!user || user.role !== 'seller') throw ApiError.notFound('Seller not found');

  const kyc = user.kyc || {};
  const address = kyc.address || {};

  const verification = {
    _id: user._id,
    sellerId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    store: user.sellerProfile ? { name: user.sellerProfile.storeName } : undefined,
    kyc: {
      _id: user._id,
      legalName: kyc.legalName,
      fathersName: kyc.fathersName,
      age: kyc.age,
      pan: kyc.panCard?.number,
      panUrl: kyc.panCard?.url,
      aadhaarNumber: kyc.aadhaarCard?.number,
      aadhaarFrontUrl: kyc.aadhaarCard?.frontUrl,
      aadhaarBackUrl: kyc.aadhaarCard?.backUrl,
      gst: kyc.gst?.number,
      gstUrl: kyc.gst?.url,
      status: mapKycStatus(user.sellerStatus),
      submittedAt: kyc.submittedAt,
      createdAt: user.createdAt,
      selfie: kyc.selfie?.url ? { url: kyc.selfie.url } : undefined,
      document: kyc.panCard?.url ? { url: kyc.panCard.url } : undefined,
      address: address.street || address.city || address.state || address.zip
        ? { street: address.street, city: address.city, state: address.state, zip: address.zip, country: address.country }
        : undefined,
      phone: kyc.phone || user.phone,
      emailVerified: kyc.emailVerified,
      phoneVerified: kyc.phoneVerified,
    },
  };

  res.json(ApiResponse.success(verification));
});

const verifySellerKyc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Seller not found');

  if (status === 'verified') {
    user.sellerStatus = 'approved';
    user.isSellerApproved = true;
    user.sellerApprovedAt = new Date();
    if (user.kyc) user.kyc.verifiedAt = new Date();
    if (user.role === 'customer') user.role = 'seller';

    let sellerProfile = await SellerProfile.findOne({ user: id });
    if (!sellerProfile) {
      const storeName = user.kyc?.legalName || user.name || 'Unknown Store';
      const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + id.toString().slice(-6);
      sellerProfile = await SellerProfile.create({
        user: id, storeName, storeSlug,
        contactEmail: user.email, contactPhone: user.phone,
        verificationStatus: 'verified',
        commissionRate: parseFloat(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 10,
      });
    } else {
      sellerProfile.verificationStatus = 'verified';
      await sellerProfile.save();
    }
  } else if (status === 'under_review') {
    user.sellerStatus = 'under_review';
  } else if (status === 'rejected') {
    user.sellerStatus = 'rejected';
    user.isSellerApproved = false;
    user.sellerRejectionReason = reason || '';
  } else {
    throw ApiError.badRequest('Invalid status');
  }

  await user.save();

  await ActivityLog.create({
    user: req.user._id,
    action: status === 'verified' ? 'approve' : 'reject',
    resource: { type: 'seller_kyc', id: user._id },
    description: `KYC ${status} for ${user.name}`,
    ip: req.ip,
  });

  res.json(ApiResponse.success({ _id: user._id }, `KYC ${status === 'verified' ? 'approved' : status}`));
});

const getAdminProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, seller, type } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (seller) filter.seller = seller;
  if (type) filter.productType = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-digitalFile -variants -seo -settings')
      .populate('seller', 'name email')
      .populate('category', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Product.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(products, 'Products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  const allowedUpdates = ['title', 'description', 'pricing', 'category', 'productType', 'images', 'inventory', 'tags', 'specifications', 'features', 'thumbnail', 'metaTitle', 'metaDescription', 'sku', 'isbn', 'author', 'publisher', 'language', 'pages', 'duration', 'difficulty', 'requirements', 'whatYouWillLearn', 'curriculum', 'status'];
  const updates = {};
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (updates.title) {
    const slugify = require('../utils/slugify');
    const slug = slugify(updates.title);
    const filter = { slug: new RegExp(`^${slug}(-\\d+)?$`) };
    filter._id = { $ne: id };
    const count = await Product.countDocuments(filter);
    updates.slug = count === 0 ? slug : `${slug}-${count}`;
  }

  if (updates.pricing) {
    if (updates.pricing.originalPrice && updates.pricing.sellingPrice) {
      const original = parseFloat(updates.pricing.originalPrice);
      const selling = parseFloat(updates.pricing.sellingPrice);
      updates.pricing.discount = original > 0 ? ((original - selling) / original) * 100 : 0;
      updates.pricing.discountType = 'percentage';
    }
    updates.pricing.priceHistory = [
      ...(product.pricing?.priceHistory || []),
      { price: updates.pricing.sellingPrice || product.pricing?.sellingPrice, effectiveDate: new Date() },
    ];
  }

  if (updates.status === PRODUCT_STATUS.PUBLISHED && product.status !== PRODUCT_STATUS.PUBLISHED) {
    updates.publishedAt = new Date();
  }

  if (updates.category && String(updates.category) !== String(product.category)) {
    await require('../models/Category').findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    await require('../models/Category').findByIdAndUpdate(updates.category, { $inc: { productCount: 1 } });
  }

  if (updates.images) {
    updates.images = updates.images.map((img, idx) => ({
      ...img, isPrimary: idx === 0,
    }));
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('seller', 'name email')
    .populate('category', 'name slug');

  await ActivityLog.create({
    user: req.user._id, action: 'update_product', resource: 'Product', resourceId: id,
    details: { changes: Object.keys(updates) },
  });

  res.status(200).json(ApiResponse.success(updatedProduct, 'Product updated successfully'));
});

const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status) throw ApiError.badRequest('Status is required');

  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  product.status = status;
  if (status === 'rejected' && rejectionReason) {
    product.rejectionReason = rejectionReason;
  }
  if (status === 'published') {
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    if (!product.publishedAt) product.publishedAt = new Date();
  }
  await product.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'update',
    resource: { type: 'product', id: product._id },
    description: `Product ${product.title} status changed to ${status}`,
    changes: { before: {}, after: { status, rejectionReason } },
    ip: req.ip,
  });

  res.json(ApiResponse.success(product, `Product ${status} successfully`));
});

const getAdminOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate, search, type } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }]
    }).select('_id');
    const userIds = matchedUsers.map(u => u._id);
    filter.$or = [
      { orderNumber: regex },
      { user: { $in: userIds } },
      { 'shippingAddress.name': regex },
    ];
  }
  if (type === 'digital') filter.orderType = 'digital';
  if (type === 'physical') filter.orderType = 'physical';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'title images productType')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success({ orders }, 'Orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, sellerId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (sellerId) filter['items.seller'] = sellerId;
  else filter['items.seller'] = { $exists: true, $ne: null };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'title images productType')
      .populate('items.seller', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(orders, 'Seller orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getUserPurchases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId } = req.params;
  const filter = { user: userId };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.product', 'title images productType')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(orders, 'User purchases fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (status) {
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: note || '',
    });

    if (status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = new Date();
    }
    if (status === ORDER_STATUS.CANCELLED) {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;
    }
  }

  await order.save();

  await ActivityLog.create({
    user: req.user._id,
    action: 'status_change',
    resource: { type: 'order', id: order._id },
    description: `Order ${order.orderNumber} status changed to ${status}`,
    changes: { before: {}, after: { status } },
    ip: req.ip,
  });

  res.json(ApiResponse.success(order, 'Order status updated successfully'));
});

const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (method) filter.method = method;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Payment.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(payments, 'Payments fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Coupon.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(coupons, 'Coupons fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const createCoupon = asyncHandler(async (req, res) => {
  const allowedFields = ['code', 'description', 'discountType', 'discountValue', 'minPurchase', 'maxDiscount', 'usageLimit', 'perUserLimit', 'applicableProducts', 'applicableCategories', 'startDate', 'endDate', 'isActive'];
  const couponData = { createdBy: req.user._id };
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      couponData[field] = req.body[field];
    }
  }
  const coupon = await Coupon.create(couponData);

  await ActivityLog.create({
    user: req.user._id,
    action: 'create',
    resource: { type: 'coupon', id: coupon._id },
    description: `Coupon ${coupon.code} created`,
    ip: req.ip,
  });

  res.status(201).json(ApiResponse.created(coupon, 'Coupon created successfully'));
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const allowedFields = ['code', 'description', 'discountType', 'discountValue', 'minPurchase', 'maxDiscount', 'usageLimit', 'perUserLimit', 'applicableProducts', 'applicableCategories', 'startDate', 'endDate', 'isActive'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  const coupon = await Coupon.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  res.json(ApiResponse.success(coupon, 'Coupon updated successfully'));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');

  await ActivityLog.create({
    user: req.user._id,
    action: 'delete',
    resource: { type: 'coupon', id: coupon._id },
    description: `Coupon ${coupon.code} deleted`,
    ip: req.ip,
  });

  res.json(ApiResponse.success(null, 'Coupon deleted successfully'));
});

const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isApproved } = req.query;
  const filter = {};

  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'title images')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Review.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(reviews, 'Reviews fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, resourceType } = req.query;
  const filter = {};

  if (action) filter.action = action;
  if (resourceType) filter['resource.type'] = resourceType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    ActivityLog.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.success(logs, 'Activity logs fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find();
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });
  res.json(ApiResponse.success(settingsMap, 'Settings fetched successfully'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const ALLOWED_SETTINGS = ['siteName', 'siteDescription', 'supportEmail', 'supportPhone', 'currency', 'taxRate', 'shippingFee', 'freeShippingThreshold', 'commissionRate', 'minWithdrawalAmount', 'maxWithdrawalAmount', 'otpExpiryMinutes', 'maxLoginAttempts', 'lockoutDurationMinutes', 'maintenanceMode', 'maintenanceMessage'];
  const settings = {};
  for (const [key, value] of Object.entries(req.body)) {
    if (ALLOWED_SETTINGS.includes(key)) {
      settings[key] = value;
    }
  }

  const operations = Object.entries(settings).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: { $set: { key, value, updatedBy: req.user._id } },
      upsert: true,
    },
  }));

  await Setting.bulkWrite(operations);

  await ActivityLog.create({
    user: req.user._id,
    action: 'update',
    resource: { type: 'settings' },
    description: 'Platform settings updated',
    ip: req.ip,
  });

  res.json(ApiResponse.success(null, 'Settings updated successfully'));
});

const getPendingReferralRewards = asyncHandler(async (req, res) => {
  const result = await referralService.getPendingFirstPurchaseRewards(req.query);
  res.json(ApiResponse.success(result.rewards, 'Pending rewards fetched', result.pagination));
});

const approveReferralReward = asyncHandler(async (req, res) => {
  const earning = await referralService.approveReferralEarning(req.params.id, req.user._id);
  res.json(ApiResponse.success(earning, 'Reward approved and credited'));
});

const rejectReferralReward = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const earning = await referralService.rejectReferralEarning(req.params.id, req.user._id, reason);
  res.json(ApiResponse.success(earning, 'Reward rejected'));
});

const getSellerReferralTrees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const match = { role: 'seller' };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    match.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { referralCode: { $regex: escaped, $options: 'i' } },
    ];
  }

  const [sellers, total] = await Promise.all([
    User.find(match).select('name email referralCode createdAt').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(match),
  ]);

  const data = await Promise.all(sellers.map(async (seller) => {
    const [directReferrals, totalTeam, earnings] = await Promise.all([
      Referral.countDocuments({ referrer: seller._id, level: 1 }),
      Referral.countDocuments({ referrer: seller._id }),
      ReferralEarning.aggregate([
        { $match: { referrer: seller._id } },
        {
          $group: {
            _id: { level: '$level', status: '$status' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byLevel = {};
    for (let l = 1; l <= 5; l++) {
      byLevel[l] = { level: l, pending: 0, credited: 0, cancelled: 0, total: 0 };
    }
    earnings.forEach(e => {
      const level = e._id.level;
      const status = e._id.status;
      if (byLevel[level]) {
        byLevel[level][status] += e.totalAmount;
        byLevel[level].total += e.totalAmount;
      }
    });

    const summary = { pending: 0, credited: 0, cancelled: 0, total: 0 };
    Object.values(byLevel).forEach(l => {
      summary.pending += l.pending;
      summary.credited += l.credited;
      summary.cancelled += l.cancelled;
      summary.total += l.total;
    });

    return {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      referralCode: seller.referralCode,
      directReferrals,
      totalTeam,
      levelIncome: Object.values(byLevel),
      summary,
    };
  }));

  res.json(ApiResponse.success(data, 'Seller referral trees fetched', { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }));
});

const getPendingSettlements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const match = {
    'items.settlementStatus': 'pending',
    'items.deliveryStatus': 'delivered',
  };

  const [orders, total] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.settlementStatus': 'pending', 'items.deliveryStatus': 'delivered' } },
      {
        $lookup: {
          from: 'users',
          localField: 'items.seller',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          createdAt: 1,
          'item._id': '$items._id',
          'item.product': '$items.product',
          'item.title': '$items.title',
          'item.total': '$items.total',
          'item.sellerEarning': '$items.sellerEarning',
          'item.settlementTax': '$items.settlementTax',
          'item.deliveredAt': '$items.deliveredAt',
          'item.settlementStatus': '$items.settlementStatus',
          'seller._id': '$sellerInfo._id',
          'seller.name': '$sellerInfo.name',
          'seller.email': '$sellerInfo.email',
          'product.title': '$productInfo.title',
          'product.thumbnail': '$productInfo.thumbnail',
        },
      },
      { $sort: { 'item.deliveredAt': -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.settlementStatus': 'pending', 'items.deliveryStatus': 'delivered' } },
      { $count: 'total' },
    ]),
  ]);

  const totalItems = total[0]?.total || 0;

  res.json(
    ApiResponse.success({ settlements: orders }, 'Pending settlements fetched', {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalItems,
      pages: Math.ceil(totalItems / parseInt(limit)),
    })
  );
});

const approveSettlement = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    'items._id': itemId,
  });
  if (!order) throw ApiError.notFound('Order or item not found');

  const item = order.items.id(itemId);
  if (!item) throw ApiError.notFound('Item not found');
  if (item.settlementStatus !== 'pending') throw ApiError.badRequest('Settlement is not pending');
  if (item.deliveryStatus !== 'delivered') throw ApiError.badRequest('Item is not delivered');

  item.settlementStatus = 'approved';
  item.settlementApprovedAt = new Date();
  item.settlementApprovedBy = req.user._id;

  await order.save();

  await walletService.confirmSettlementCredit(item.seller, item.sellerEarning);

  await WalletTransaction.create({
    user: item.seller,
    type: 'seller_settlement',
    amount: item.sellerEarning,
    description: `Settlement approved for order ${order.orderNumber}`,
    reference: { order: orderId },
    status: 'completed',
  });

  const populated = await Order.findById(order._id)
    .populate('items.product', 'title thumbnail');

  res.json(ApiResponse.success(populated, 'Settlement approved successfully'));
});

const getAdminWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const total = await WithdrawalRequest.countDocuments(filter);
  const withdrawals = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('user', 'name email')
    .lean();

  res.json(ApiResponse.success({ withdrawals, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }, 'Withdrawals fetched'));
});

const getWithdrawalStats = asyncHandler(async (req, res) => {
  const stats = await WithdrawalRequest.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
  ]);

  const result = { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0, totalAmount: 0 };
  stats.forEach(s => {
    if (result[s._id] !== undefined) result[s._id] = s.count;
    result.totalAmount = (result.totalAmount || 0) + s.total;
  });

  res.json(ApiResponse.success(result, 'Withdrawal stats fetched'));
});

const approveWithdrawal = asyncHandler(async (req, res) => {
  const { transactionRef } = req.body;
  const withdrawal = await WithdrawalRequest.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal not found');
  if (withdrawal.status !== 'pending') throw ApiError.badRequest('Withdrawal already processed');

  withdrawal.status = 'completed';
  withdrawal.transactionId = transactionRef;
  withdrawal.processedAt = new Date();
  withdrawal.processedBy = req.user._id;
  await withdrawal.save();

  await walletService.confirmWithdrawalDeduction(withdrawal.user, withdrawal.amount);

  res.json(ApiResponse.success(withdrawal, 'Withdrawal approved'));
});

const rejectWithdrawal = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const withdrawal = await WithdrawalRequest.findById(req.params.id);
  if (!withdrawal) throw ApiError.notFound('Withdrawal not found');
  if (withdrawal.status !== 'pending') throw ApiError.badRequest('Withdrawal already processed');

  withdrawal.status = 'rejected';
  withdrawal.rejectionReason = reason || '';
  withdrawal.processedBy = req.user._id;
  await withdrawal.save();

  await walletService.releaseWithdrawalAmount(withdrawal.user, withdrawal.amount);

  res.json(ApiResponse.success(withdrawal, 'Withdrawal rejected'));
});

// --- Product Approvals ---

const getProductApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = { status: { $in: ['pending', 'published', 'rejected'] } };
  if (status && ['pending', 'published', 'rejected'].includes(status)) {
    query.status = status;
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'name email store')
      .populate('category', 'name slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query),
  ]);
  const [pending, approved, rejected] = await Promise.all([
    Product.countDocuments({ status: 'pending' }),
    Product.countDocuments({ status: 'published' }),
    Product.countDocuments({ status: 'rejected' }),
  ]);
  res.json(ApiResponse.success({
    products,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    stats: { pending, approved, rejected },
  }));
});

const batchApproveProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Product IDs are required');
  }
  await Product.updateMany(
    { _id: { $in: ids }, status: 'pending' },
    { $set: { status: 'published', approvedBy: req.user._id, approvedAt: new Date(), publishedAt: new Date() } }
  );
  res.json(ApiResponse.success(null, `${ids.length} product(s) approved`));
});

const batchRejectProducts = asyncHandler(async (req, res) => {
  const { ids, reason } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Product IDs are required');
  }
  await Product.updateMany(
    { _id: { $in: ids }, status: 'pending' },
    { $set: { status: 'rejected', rejectionReason: reason || '', approvedBy: req.user._id, approvedAt: new Date() } }
  );
  res.json(ApiResponse.success(null, `${ids.length} product(s) rejected`));
});

// --- Settlement Payouts ---

const getSettlementSummary = asyncHandler(async (req, res) => {
  const [pipeline] = await Payout.aggregate([
    { $group: { _id: null, totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$netAmount', 0] } }, totalPending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, '$netAmount', 0] } } } },
  ]);
  const sellersPending = await Payout.distinct('seller', { status: 'pending' });
  res.json(ApiResponse.success({
    totalPaid: pipeline?.totalPaid || 0,
    totalPending: pipeline?.totalPending || 0,
    sellersPending: sellersPending.length,
  }));
});

const getPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
    query.status = status;
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .populate('seller', 'name email store')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Payout.countDocuments(query),
  ]);
  res.json(ApiResponse.success({
    payouts,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  }));
});

const createPayout = asyncHandler(async (req, res) => {
  const { sellerId, amount, period } = req.body;
  if (!sellerId || !amount || !period) {
    throw ApiError.badRequest('sellerId, amount, and period are required');
  }
  const seller = await User.findById(sellerId);
  if (!seller) throw ApiError.notFound('Seller not found');
  const payout = await Payout.create({
    seller: sellerId,
    amount: parseFloat(amount),
    commissionDeducted: 0,
    netAmount: parseFloat(amount),
    method: 'bank_transfer',
    periodStart: new Date(),
    periodEnd: new Date(),
    requestedAt: new Date(),
    initiatedBy: req.user._id,
  });
  res.status(201).json(ApiResponse.created(payout, 'Payout created'));
});

const processPayout = asyncHandler(async (req, res) => {
  const { status, transactionRef } = req.body;
  if (!['completed', 'failed'].includes(status)) {
    throw ApiError.badRequest('Status must be "completed" or "failed"');
  }
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw ApiError.notFound('Payout not found');
  if (payout.status !== 'pending') throw ApiError.badRequest('Payout already processed');
  payout.status = status;
  payout.transactionReference = transactionRef || '';
  payout.approvedBy = req.user._id;
  payout.processedAt = new Date();
  if (status === 'completed') payout.completedAt = new Date();
  await payout.save();
  res.json(ApiResponse.success(payout, `Payout ${status === 'completed' ? 'approved' : 'rejected'}`));
});

module.exports = {
  getDashboard,
  getUsers,
  updateUser,
  getSellers,
  approveSeller,
  getSellerVerifications,
  getSellerVerificationById,
  verifySellerKyc,
  getAdminProducts,
  updateProduct,
  updateProductStatus,
  getAdminOrders,
  updateOrderStatus,
  getSellerOrders,
  getUserPurchases,
  getPayments,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getReviews,
  getActivityLogs,
  getSettings,
  updateSettings,
  getPendingReferralRewards,
  approveReferralReward,
  rejectReferralReward,
  getPendingSettlements,
  approveSettlement,
  getSellerReferralTrees,
  getAdminWithdrawals,
  getWithdrawalStats,
  approveWithdrawal,
  rejectWithdrawal,
  getProductApprovals,
  batchApproveProducts,
  batchRejectProducts,
  getSettlementSummary,
  getPayouts,
  createPayout,
  processPayout,
};
