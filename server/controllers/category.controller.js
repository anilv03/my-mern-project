const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Category = require('../models/Category');
const Product = require('../models/Product');
const slugify = require('../utils/slugify');

const getCategories = asyncHandler(async (req, res) => {
  const { isActive, isFeatured, productType, parent, page = 1, limit = 50, sort } = req.query;
  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
  if (productType) filter.productType = productType;
  if (parent === 'null') filter.parent = null;
  else if (parent) filter.parent = parent;

  let sortOption = { displayOrder: 1, name: 1 };
  if (sort === 'name') sortOption = { name: 1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  if (sort === 'popular') sortOption = { productCount: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)).populate('parent', 'name slug'),
    Category.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(categories, 'Categories fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate('parent', 'name slug')
    .populate('children', 'name slug image');

  if (!category) throw ApiError.notFound('Category not found');

  res.status(200).json(ApiResponse.success(category, 'Category fetched successfully'));
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parent', 'name slug')
    .populate('children', 'name slug image');

  if (!category) throw ApiError.notFound('Category not found');

  res.status(200).json(ApiResponse.success(category, 'Category fetched successfully'));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, productType, parent, icon, displayOrder, isFeatured, seo } = req.body;
  const slug = slugify(name);

  const category = await Category.create({
    name,
    slug,
    description,
    productType: productType || 'all',
    parent: parent || null,
    icon,
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    seo,
  });

  res.status(201).json(ApiResponse.created(category, 'Category created successfully'));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.name) {
    updates.slug = slugify(updates.name);
  }

  const category = await Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('parent', 'name slug');

  if (!category) throw ApiError.notFound('Category not found');

  res.status(200).json(ApiResponse.success(category, 'Category updated successfully'));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');

  const hasChildren = await Category.findOne({ parent: id });
  if (hasChildren) {
    throw ApiError.badRequest('Cannot delete category with subcategories. Remove or reassign them first.');
  }

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete category with ${productCount} products. Reassign products first.`
    );
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json(ApiResponse.success(null, 'Category deleted successfully'));
});

const getCategoryProducts = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug });
  if (!category) throw ApiError.notFound('Category not found');

  const {
    page = 1,
    limit = 20,
    sort = 'newest',
    minPrice,
    maxPrice,
    productType,
    rating,
    inStock,
  } = req.query;

  const filter = { category: category._id, status: 'published' };

  if (minPrice || maxPrice) {
    filter['pricing.sellingPrice'] = {};
    if (minPrice) filter['pricing.sellingPrice'].$gte = parseFloat(minPrice);
    if (maxPrice) filter['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
  }
  if (productType) filter.productType = productType;
  if (rating) filter['ratings.average'] = { $gte: parseFloat(rating) };
  if (inStock === 'true') filter['inventory.quantity'] = { $gt: 0 };

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { 'pricing.sellingPrice': 1 };
  if (sort === 'price_desc') sortOption = { 'pricing.sellingPrice': -1 };
  if (sort === 'rating') sortOption = { 'ratings.average': -1 };
  if (sort === 'sales') sortOption = { 'sales.count': -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'name_asc') sortOption = { title: 1 };
  if (sort === 'name_desc') sortOption = { title: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-seo -bundleContent -variants -digitalFile')
      .populate('seller', 'name avatar'),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(products, 'Products fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      category: category.name,
    })
  );
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();

  const buildTree = (parentId = null) =>
    categories
      .filter((c) => String(c.parent || null) === String(parentId))
      .map((c) => ({
        ...c,
        children: buildTree(c._id),
      }));

  const tree = buildTree(null);

  res.status(200).json(ApiResponse.success(tree, 'Category tree fetched successfully'));
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
  getCategoryTree,
};
