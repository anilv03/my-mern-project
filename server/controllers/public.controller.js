const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const cache = require('../utils/cache');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Order = require('../models/Order');
const FlashSale = require('../models/FlashSale');
const Blog = require('../models/Blog');

exports.getHomepageData = asyncHandler(async (req, res) => {
  const data = await cache.wrap('homepage', async () => {
    const now = new Date();
    const [
      activeStudents,
      totalSellers,
      totalProducts,
      totalOrders,
      featuredSellers,
      featuredReviews,
      featuredProducts,
      bestSellers,
      newArrivals,
      videoCourses,
      activeSales,
      featuredBlogs,
      categories,
      allProducts,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true }),
      SellerProfile.countDocuments({ isActive: true }),
      Product.countDocuments({ status: 'published' }),
      Order.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      SellerProfile.find({ isActive: true, isFeatured: true })
        .select('storeName storeSlug storeLogo rating totalProducts totalOrders')
        .populate('user', 'name')
        .sort({ rating: -1 })
        .limit(8)
        .lean(),
      Review.find({ isApproved: true })
        .populate('user', 'name avatar')
        .populate('product', 'title slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ 'settings.isFeatured': true, status: 'published' })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ status: 'published' })
        .sort({ 'sales.count': -1 })
        .limit(8)
        .lean(),
      Product.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ productType: 'video_course', status: 'published' })
        .limit(3)
        .lean(),
      FlashSale.find({
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gte: now },
      })
        .populate('products.product', 'title slug images pricing')
        .sort('-sortOrder')
        .lean(),
      Blog.find({ isPublished: true, isFeatured: true })
        .populate('author', 'name avatar')
        .sort('-publishedAt')
        .limit(6)
        .lean(),
      Category.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .limit(10)
        .lean(),
      Product.find({ status: 'published' })
        .select('title slug thumbnail pricing.sellingPrice pricing.originalPrice images ratings.average ratings.count status')
        .limit(200)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const stats = {
      activeStudents,
      totalSellers,
      totalProducts,
      totalOrders,
    };

    const sellersWithUser = featuredSellers.map(s => ({
      _id: s._id,
      storeName: s.storeName,
      storeSlug: s.storeSlug,
      storeLogo: s.storeLogo?.url || null,
      rating: s.rating || 0,
      totalProducts: s.totalProducts || 0,
      totalSales: s.totalOrders || 0,
    }));

    return {
      stats,
      featuredSellers: sellersWithUser,
      featuredReviews,
      featuredProducts,
      bestSellers,
      newArrivals,
      videoCourses,
      activeSales,
      featuredBlogs,
      categories,
      allProducts,
    };
  }, 300 * 1000);

  res.json(ApiResponse.success(data));
});

exports.getHomepageStats = asyncHandler(async (req, res) => {
  const [activeStudents, totalSellers, totalProducts, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'customer', isActive: true }),
    SellerProfile.countDocuments({ isActive: true }),
    Product.countDocuments({ status: 'published' }),
    Order.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
  ]);

  res.json(ApiResponse.success({
    activeStudents,
    totalSellers,
    totalProducts,
    recentOrders,
  }));
});
