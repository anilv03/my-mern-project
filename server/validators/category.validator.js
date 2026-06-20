const { body, param } = require('express-validator');
const slugify = require('../utils/slugify');
const Category = require('../models/Category');

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .custom(async (name) => {
      const existing = await Category.findOne({ slug: slugify(name) });
      if (existing) throw new Error('Category with this name already exists');
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('productType')
    .optional()
    .isIn(['ebook', 'audiobook', 'video_course', 'course_bundle', 'software', 'template', 'subscription', 'new_book', 'book_combo', 'used_book', 'all'])
    .withMessage('Invalid product type'),

  body('parent')
    .optional({ values: 'falsy' })
    .isMongoId().withMessage('Invalid parent category ID')
    .custom(async (parentId) => {
      const parent = await Category.findById(parentId);
      if (!parent) throw new Error('Parent category not found');
      return true;
    }),

  body('icon').optional().trim(),

  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),

  body('isFeatured').optional().isBoolean(),

  body('seo.metaTitle').optional().trim().isLength({ max: 70 }),
  body('seo.metaDescription').optional().trim().isLength({ max: 160 }),
  body('seo.metaKeywords').optional().isArray(),
];

const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Invalid category ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .custom(async (name, { req }) => {
      const existing = await Category.findOne({ slug: slugify(name), _id: { $ne: req.params.id } });
      if (existing) throw new Error('Category with this name already exists');
      return true;
    }),

  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('productType')
    .optional()
    .isIn(['ebook', 'audiobook', 'video_course', 'course_bundle', 'software', 'template', 'subscription', 'new_book', 'book_combo', 'used_book', 'all'])
    .withMessage('Invalid product type'),

  body('parent')
    .optional({ values: 'falsy' })
    .isMongoId().withMessage('Invalid parent category ID')
    .custom(async (parentId, { req }) => {
      if (parentId === req.params.id) throw new Error('Category cannot be its own parent');
      const parent = await Category.findById(parentId);
      if (!parent) throw new Error('Parent category not found');
      return true;
    }),

  body('icon').optional().trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
];

const categoryIdValidator = [
  param('id').isMongoId().withMessage('Invalid category ID'),
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
};
