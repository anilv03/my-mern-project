const mongoose = require('mongoose');
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getActiveFlashSales = asyncHandler(async (req, res) => {
  const now = new Date();
  const sales = await FlashSale.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  })
  .populate('products.product', 'title slug images pricing')
  .sort('-sortOrder');
  res.json(ApiResponse.success(sales));
});

exports.getFlashSaleBySlug = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findOne({ slug: req.params.slug })
    .populate('products.product', 'title slug images pricing seller');
  if (!sale) throw ApiError.notFound('Flash sale not found');
  res.json(ApiResponse.success(sale));
});

exports.getAllFlashSales = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  const [sales, total] = await Promise.all([
    FlashSale.find(filter).sort('-createdAt').skip(skip).limit(limit),
    FlashSale.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    sales, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.createFlashSale = asyncHandler(async (req, res) => {
  const { title, description, banner, startTime, endTime, productIds, products, isFeatured, sortOrder } = req.body;
  if (!title || !startTime || !endTime) {
    throw ApiError.badRequest('Title, start time, and end time are required');
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  let formattedProducts = products;
  if (!formattedProducts && productIds?.length) {
    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const slugs = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id)).map(id => String(id).toLowerCase());
    const foundProducts = [];
    if (validIds.length) foundProducts.push(...await Product.find({ _id: { $in: validIds } }).select('slug pricing'));
    if (slugs.length) foundProducts.push(...await Product.find({ slug: { $in: slugs } }).select('slug pricing'));
    formattedProducts = productIds.map(id => {
      const isId = mongoose.Types.ObjectId.isValid(id);
      const match = foundProducts.find(p =>
        isId ? String(p._id) === id : p.slug === String(id).toLowerCase()
      );
      if (!match) return null;
      return {
        product: match._id,
        salePrice: match.pricing?.sellingPrice || 0,
        discountPercent: 0,
        quantity: 10,
        maxPerUser: 1,
      };
    }).filter(Boolean);
  }
  const sale = await FlashSale.create({
    title, slug, description, banner, startTime, endTime, isFeatured, sortOrder,
    products: formattedProducts || [],
    createdBy: req.user._id,
  });
  res.status(201).json(ApiResponse.created(sale, 'Flash sale created'));
});

exports.updateFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  const { title, description, banner, startTime, endTime, productIds, products, isActive, isFeatured, sortOrder } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (banner !== undefined) updates.banner = banner;
  if (startTime !== undefined) updates.startTime = startTime;
  if (endTime !== undefined) updates.endTime = endTime;
  if (isActive !== undefined) updates.isActive = isActive;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (products !== undefined) {
    updates.products = products;
  } else if (productIds?.length) {
    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const slugs = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id)).map(id => String(id).toLowerCase());
    const foundProducts = [];
    if (validIds.length) foundProducts.push(...await Product.find({ _id: { $in: validIds } }).select('slug pricing'));
    if (slugs.length) foundProducts.push(...await Product.find({ slug: { $in: slugs } }).select('slug pricing'));
    updates.products = productIds.map(id => {
      const isId = mongoose.Types.ObjectId.isValid(id);
      const match = foundProducts.find(p =>
        isId ? String(p._id) === id : p.slug === String(id).toLowerCase()
      );
      if (!match) return null;
      return {
        product: match._id,
        salePrice: match.pricing?.sellingPrice || 0,
        discountPercent: 0,
        quantity: 10,
        maxPerUser: 1,
      };
    }).filter(Boolean);
  }
  const updated = await FlashSale.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!updated) throw ApiError.notFound('Flash sale not found');
  res.json(ApiResponse.success(updated, 'Flash sale updated'));
});

exports.deleteFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findByIdAndDelete(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  res.json(ApiResponse.success(null, 'Flash sale deleted'));
});

exports.toggleFlashSale = asyncHandler(async (req, res) => {
  const sale = await FlashSale.findById(req.params.id);
  if (!sale) throw ApiError.notFound('Flash sale not found');
  sale.isActive = !sale.isActive;
  await sale.save();
  res.json(ApiResponse.success(sale, `Flash sale ${sale.isActive ? 'activated' : 'deactivated'}`));
});
