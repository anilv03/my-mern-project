const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const { PRODUCT_STATUS } = require('../constants/productTypes');
const { ORDER_STATUS } = require('../constants/orderStatus');
const slugify = require('../utils/slugify');

const generateUniqueSlug = async (title, excludeId = null) => {
  const slug = slugify(title);
  const filter = { slug: new RegExp(`^${slug}(-\\d+)?$`) };
  if (excludeId) filter._id = { $ne: excludeId };
  const count = await Product.countDocuments(filter);
  return count === 0 ? slug : `${slug}-${count}`;
};

const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = 'newest',
    minPrice,
    maxPrice,
    productType,
    category,
    rating,
    inStock,
    featured,
    bestSeller,
    newArrival,
    q,
    seller,
    status,
  } = req.query;

  const filter = {};

  const isAdminOrSeller = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
  const isSeller = req.user && req.user.role === 'seller';

  if (status && isAdminOrSeller) {
    filter.status = status;
  } else if (isSeller) {
    filter.seller = req.user._id;
    if (status) filter.status = status;
  } else {
    filter.status = PRODUCT_STATUS.PUBLISHED;
  }

  if (seller && !isSeller) filter.seller = seller;
  if (minPrice || maxPrice) {
    filter['pricing.sellingPrice'] = {};
    if (minPrice) filter['pricing.sellingPrice'].$gte = parseFloat(minPrice);
    if (maxPrice) filter['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
  }
  if (productType) filter.productType = productType;
  if (category) filter.category = category;
  if (rating) filter['ratings.average'] = { $gte: parseFloat(rating) };
  if (inStock === 'true') filter['inventory.quantity'] = { $gt: 0 };
  if (featured === 'true') filter['settings.isFeatured'] = true;
  if (bestSeller === 'true') filter['settings.isBestSeller'] = true;
  if (newArrival === 'true') filter['settings.isNewArrival'] = true;
  if (q) {
    filter.$text = { $search: q };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { 'pricing.sellingPrice': 1 };
  if (sort === 'price_desc') sortOption = { 'pricing.sellingPrice': -1 };
  if (sort === 'rating') sortOption = { 'ratings.average': -1 };
  if (sort === 'sales') sortOption = { 'sales.count': -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'name_asc') sortOption = { title: 1 };
  if (sort === 'name_desc') sortOption = { title: -1 };
  if (sort === 'relevance' && q) sortOption = { score: { $meta: 'textScore' } };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let query = Product.find(filter);

  if (sort === 'relevance' && q) {
    query = query.select({ score: { $meta: 'textScore' } });
  }

  const [products, total] = await Promise.all([
    query
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-seo -bundleContent -variants -digitalFile')
      .populate('seller', 'name avatar')
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(products, 'Products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getDigitalProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = 'newest',
    productType,
    category,
    q,
  } = req.query;

  const filter = {
    status: PRODUCT_STATUS.PUBLISHED,
    productType: { $in: ['ebook', 'ebook_combo', 'video_course', 'audiobook', 'subscription'] },
  };

  if (productType) filter.productType = productType;
  if (category) filter.category = category;
  if (q) {
    filter.$text = { $search: q };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { 'pricing.sellingPrice': 1 };
  if (sort === 'price_desc') sortOption = { 'pricing.sellingPrice': -1 };
  if (sort === 'rating') sortOption = { 'ratings.average': -1 };
  if (sort === 'sales') sortOption = { 'sales.count': -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug thumbnail pricing.sellingPrice pricing.originalPrice productType deliveryType downloadAllowed streamOnly ratings.average seller images')
      .populate('seller', 'name avatar')
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(products, 'Digital products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const sanitizeDigitalContent = async (product, userId) => {
  if (!userId) {
    product.digitalFile = undefined;
    return product;
  }
  const [hasPurchased, activeSub] = await Promise.all([
    Order.findOne({
      user: userId,
      'items.product': product._id,
      status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED] },
    }),
    Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $gte: new Date() },
    }),
  ]);
  if (!hasPurchased && !activeSub) {
    product.digitalFile = undefined;
  }
  return product;
};

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate({ path: 'seller', select: 'name avatar email phone sellerStatus createdAt', populate: { path: 'sellerProfile', select: 'storeName storeDescription storeLogo storeBanner storeSlug contactEmail contactPhone rating totalProducts' } })
    .populate('category', 'name slug')
    .populate({
      path: 'reviews',
      options: { sort: { createdAt: -1 }, limit: 10 },
      populate: { path: 'user', select: 'name avatar' },
    })
    .lean();

  if (!product) throw ApiError.notFound('Product not found');

  if (product.status !== PRODUCT_STATUS.PUBLISHED) {
    if (!req.user) throw ApiError.notFound('Product not found');
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && String(product.seller._id || product.seller) !== String(req.user._id)) {
      throw ApiError.notFound('Product not found');
    }
  }

  await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

  const userId = req.user?._id;
  await sanitizeDigitalContent(product, userId);

  res.status(200).json(ApiResponse.success(product, 'Product fetched successfully'));
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({ path: 'seller', select: 'name avatar email phone sellerStatus createdAt', populate: { path: 'sellerProfile', select: 'storeName storeDescription storeLogo storeBanner storeSlug contactEmail contactPhone rating totalProducts' } })
    .populate('category', 'name slug')
    .populate({
      path: 'reviews',
      options: { sort: { createdAt: -1 }, limit: 10 },
      populate: { path: 'user', select: 'name avatar' },
    })
    .lean();

  if (!product) throw ApiError.notFound('Product not found');

  const userId = req.user?._id;
  await sanitizeDigitalContent(product, userId);

  res.status(200).json(ApiResponse.success(product, 'Product fetched successfully'));
});

const createProduct = asyncHandler(async (req, res) => {
  const slug = await generateUniqueSlug(req.body.title);

  const allowedFields = ['title', 'description', 'pricing', 'category', 'productType', 'images', 'inventory', 'tags', 'specifications', 'features', 'thumbnail', 'metaTitle', 'metaDescription', 'sku', 'isbn', 'author', 'publisher', 'language', 'pages', 'duration', 'difficulty', 'requirements', 'whatYouWillLearn', 'curriculum'];
  const productData = { slug, seller: req.user._id, status: PRODUCT_STATUS.PUBLISHED, publishedAt: new Date() };
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      productData[field] = req.body[field];
    }
  }

  if (productData.pricing) {
    const original = parseFloat(productData.pricing.originalPrice);
    const selling = parseFloat(productData.pricing.sellingPrice);
    if (original > 0) {
      productData.pricing.discount = ((original - selling) / original) * 100;
      productData.pricing.discountType = 'percentage';
    }
    productData.pricing.priceHistory = [{ price: selling, effectiveDate: new Date() }];
  }

  const isDigital = productData.productType && !['new_book', 'used_book'].includes(productData.productType);
  if (isDigital) {
    productData.inventory = {
      ...(productData.inventory || {}),
      trackInventory: false,
      quantity: 99999,
    };
  }

  const product = await Product.create(productData);

  await Category.findByIdAndUpdate(productData.category, { $inc: { productCount: 1 } });

  res.status(201).json(ApiResponse.created(product, 'Product created successfully'));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) throw ApiError.notFound('Product not found');

  if (String(product.seller) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Not authorized to update this product');
  }

  const allowedUpdates = ['title', 'description', 'pricing', 'category', 'productType', 'images', 'inventory', 'tags', 'specifications', 'features', 'thumbnail', 'metaTitle', 'metaDescription', 'sku', 'isbn', 'author', 'publisher', 'language', 'pages', 'duration', 'difficulty', 'requirements', 'whatYouWillLearn', 'curriculum', 'status'];
  const updates = {};
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (updates.title) {
    updates.slug = await generateUniqueSlug(updates.title, id);
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
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    await Category.findByIdAndUpdate(updates.category, { $inc: { productCount: 1 } });
  }

  if (updates.images) {
    updates.images = updates.images.map((img, idx) => ({
      ...img,
      isPrimary: idx === 0,
    }));
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('seller', 'name avatar')
    .populate('category', 'name slug');

  res.status(200).json(ApiResponse.success(updatedProduct, 'Product updated successfully'));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) throw ApiError.notFound('Product not found');

  if (String(product.seller) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Not authorized to delete this product');
  }

  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

  await Product.findByIdAndDelete(id);

  res.status(200).json(ApiResponse.success(null, 'Product deleted successfully'));
});

const submitProductForReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) throw ApiError.notFound('Product not found');
  if (String(product.seller) !== String(req.user._id)) {
    throw ApiError.forbidden('Not authorized');
  }
  if (product.status !== PRODUCT_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft products can be submitted for review');
  }

  product.status = PRODUCT_STATUS.PENDING;
  await product.save();

  res.status(200).json(ApiResponse.success(product, 'Product submitted for review'));
});

const approveProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== PRODUCT_STATUS.PENDING) {
    throw ApiError.badRequest('Product is not pending review');
  }

  product.status = PRODUCT_STATUS.PUBLISHED;
  product.approvedBy = req.user._id;
  product.approvedAt = new Date();
  product.publishedAt = product.publishedAt || new Date();
  await product.save();

  res.status(200).json(ApiResponse.success(product, 'Product approved and published'));
});

const rejectProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) throw ApiError.badRequest('Rejection reason is required');

  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  product.status = PRODUCT_STATUS.REJECTED;
  product.rejectionReason = reason;
  product.approvedBy = req.user._id;
  await product.save();

  res.status(200).json(ApiResponse.success(product, 'Product rejected'));
});

const getSellerProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, sort = 'newest' } = req.query;
  const filter = { seller: req.user._id };

  if (status) filter.status = status;

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'name_asc') sortOption = { title: 1 };
  if (sort === 'name_desc') sortOption = { title: -1 };
  if (sort === 'sales') sortOption = { 'sales.count': -1 };
  if (sort === 'price_asc') sortOption = { 'pricing.sellingPrice': 1 };
  if (sort === 'price_desc') sortOption = { 'pricing.sellingPrice': -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  const counts = await Product.aggregate([
    { $match: { seller: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts = { draft: 0, pending: 0, published: 0, rejected: 0, archived: 0 };
  counts.forEach((c) => { statusCounts[c._id] = c.count; });

  res.status(200).json(
    ApiResponse.success(products, 'Seller products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      counts: statusCounts,
    })
  );
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    status: PRODUCT_STATUS.PUBLISHED,
    'settings.isFeatured': true,
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .select('-seo -bundleContent -variants -digitalFile')
    .populate('seller', 'name avatar')
    .populate('category', 'name slug')
    .lean();

  res.status(200).json(ApiResponse.success(products, 'Featured products fetched successfully'));
});

const getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({
    status: PRODUCT_STATUS.PUBLISHED,
    'settings.isBestSeller': true,
  })
    .sort({ 'sales.count': -1 })
    .limit(12)
    .select('-seo -bundleContent -variants -digitalFile')
    .populate('seller', 'name avatar')
    .populate('category', 'name slug')
    .lean();

  res.status(200).json(ApiResponse.success(products, 'Best sellers fetched successfully'));
});

const getNewArrivals = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const products = await Product.find({
    status: PRODUCT_STATUS.PUBLISHED,
    createdAt: { $gte: thirtyDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('-seo -bundleContent -variants -digitalFile')
    .populate('seller', 'name avatar')
    .populate('category', 'name slug')
    .lean();

  res.status(200).json(ApiResponse.success(products, 'New arrivals fetched successfully'));
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('category tags productType').lean();
  if (!product) throw ApiError.notFound('Product not found');

  const related = await Product.find({
    _id: { $ne: product._id },
    status: PRODUCT_STATUS.PUBLISHED,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags || [] } },
      { productType: product.productType },
    ],
  })
    .sort({ 'ratings.average': -1, 'sales.count': -1 })
    .limit(8)
    .select('-seo -bundleContent -variants -digitalFile')
    .populate('seller', 'name avatar')
    .populate('category', 'name slug')
    .lean();

  res.status(200).json(ApiResponse.success(related, 'Related products fetched successfully'));
});

const getProductsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const filter = { seller: sellerId, status: PRODUCT_STATUS.PUBLISHED };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
      .select('-seo -bundleContent -variants -digitalFile')
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(products, 'Seller products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, action, value } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw ApiError.badRequest('Product IDs array is required');
  }

  const validActions = ['status', 'featured', 'delete'];
  if (!validActions.includes(action)) {
    throw ApiError.badRequest(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }

  const filter = { _id: { $in: productIds }, seller: req.user._id };

  if (action === 'delete') {
    const categories = await Product.distinct('category', filter);
    await Category.updateMany({ _id: { $in: categories } }, { $inc: { productCount: -1 } });
    await Product.deleteMany(filter);
  } else if (action === 'status') {
    if (!Object.values(PRODUCT_STATUS).includes(value)) {
      throw ApiError.badRequest('Invalid status value');
    }
    await Product.updateMany(filter, { status: value });
  } else if (action === 'featured') {
    await Product.updateMany(filter, { 'settings.isFeatured': !!value });
  }

  res.status(200).json(ApiResponse.success(null, `Bulk ${action} completed successfully`));
});

module.exports = {
  getProducts,
  getDigitalProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  submitProductForReview,
  approveProduct,
  rejectProduct,
  getSellerProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
  getProductsBySeller,
  bulkUpdateProducts,
};
