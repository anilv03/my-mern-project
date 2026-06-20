const { body, param, query } = require('express-validator');
const { PRODUCT_TYPES_ARRAY } = require('../constants/productTypes');
const Category = require('../models/Category');

const createProductValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Product title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Short description cannot exceed 300 characters'),

  body('productType')
    .notEmpty().withMessage('Product type is required')
    .isIn(PRODUCT_TYPES_ARRAY).withMessage('Invalid product type'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID')
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) throw new Error('Category not found');
      if (!category.isActive) throw new Error('Category is not active');
      return true;
    }),

  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').isString().trim(),

  body('pricing.originalPrice')
    .notEmpty().withMessage('Original price is required')
    .isFloat({ min: 0 }).withMessage('Original price must be a positive number'),

  body('pricing.sellingPrice')
    .notEmpty().withMessage('Selling price is required')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number')
    .custom((value, { req }) => {
      if (parseFloat(value) > parseFloat(req.body.pricing?.originalPrice || 0)) {
        throw new Error('Selling price cannot exceed original price');
      }
      return true;
    }),

  body('pricing.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),

  body('inventory.quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),

  body('inventory.trackInventory').optional().isBoolean(),
  body('inventory.allowBackorder').optional().isBoolean(),
  body('inventory.lowStockThreshold').optional().isInt({ min: 0 }),

  body('physicalDetails.isbn').optional().trim(),
  body('physicalDetails.isbn13').optional().trim(),
  body('physicalDetails.publisher').optional().trim(),
  body('physicalDetails.language').optional().trim(),
  body('physicalDetails.pageCount').optional().isInt({ min: 1 }),
  body('physicalDetails.format').optional().isIn(['paperback', 'hardcover', 'spiral', 'other']),
  body('physicalDetails.condition').optional().isIn(['new', 'like_new', 'very_good', 'good', 'acceptable', 'poor']),
  body('physicalDetails.edition').optional().trim(),

  body('digitalFile.fileType')
    .optional()
    .isIn(['pdf', 'epub', 'mp3', 'mp4', 'zip', 'exe', 'other']).withMessage('Invalid file type'),
  body('digitalFile.author').optional().trim(),
  body('digitalFile.isbn').optional().trim(),
  body('digitalFile.publisher').optional().trim(),
  body('digitalFile.language').optional().trim(),
  body('digitalFile.pages').optional().isInt({ min: 1 }),

  body('digitalFile.isDownloadable').optional().isBoolean(),
  body('digitalFile.downloadLimit').optional().isInt({ min: 0 }),

  body('settings.isFeatured').optional().isBoolean(),
  body('settings.isBundle').optional().isBoolean(),
  body('settings.isSubscription').optional().isBoolean(),
  body('settings.requiresShipping').optional().isBoolean(),
  body('settings.isDownloadable').optional().isBoolean(),
  body('settings.isbnRequired').optional().isBoolean(),
  body('settings.ageRestriction').optional().isInt({ min: 0, max: 100 }),

  body('variants').optional().isArray(),
  body('variants.*.type').optional().isIn(['format', 'edition', 'language', 'region', 'bundle']),
  body('variants.*.name').optional().trim().notEmpty(),
  body('variants.*.sku').optional().trim(),
  body('variants.*.price').optional().isFloat({ min: 0 }),
  body('variants.*.stock').optional().isInt({ min: 0 }),

  body('bundleContent').optional().isArray(),
  body('bundleContent.*.product').optional().isMongoId(),
  body('bundleContent.*.quantity').optional().isInt({ min: 1 }),

  body('seo.metaTitle').optional().trim().isLength({ max: 70 }),
  body('seo.metaDescription').optional().trim().isLength({ max: 160 }),
  body('seo.metaKeywords').optional().isArray(),
];

const updateProductValidator = [
  param('id').isMongoId().withMessage('Invalid product ID'),

  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('shortDescription').optional().trim().isLength({ max: 300 }),
  body('productType').optional().isIn(PRODUCT_TYPES_ARRAY),
  body('category').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('pricing.originalPrice').optional().isFloat({ min: 0 }),
  body('pricing.sellingPrice').optional().isFloat({ min: 0 }),
  body('pricing.taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('inventory.quantity').optional().isInt({ min: 0 }),
  body('inventory.trackInventory').optional().isBoolean(),
  body('inventory.allowBackorder').optional().isBoolean(),
  body('status').optional().isIn(['draft', 'pending', 'published', 'archived']),
  body('settings.isFeatured').optional().isBoolean(),
  body('settings.isBundle').optional().isBoolean(),
  body('settings.requiresShipping').optional().isBoolean(),
  body('settings.isDownloadable').optional().isBoolean(),
  body('variants').optional().isArray(),
  body('bundleContent').optional().isArray(),
];

const productIdValidator = [
  param('id').isMongoId().withMessage('Invalid product ID'),
];

const listProductsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('sort').optional().isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'sales', 'name_asc', 'name_desc']),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('productType').optional().isIn(PRODUCT_TYPES_ARRAY),
  query('category').optional().isMongoId(),
  query('rating').optional().isFloat({ min: 1, max: 5 }).toFloat(),
  query('inStock').optional().isBoolean().toBoolean(),
  query('featured').optional().isBoolean().toBoolean(),
  query('q').optional().trim(),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  listProductsValidator,
};
