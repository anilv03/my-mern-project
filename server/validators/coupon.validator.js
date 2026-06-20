const { body, param, query } = require('express-validator');

const createCouponValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 3, max: 50 }).withMessage('Code must be between 3 and 50 characters')
    .matches(/^[A-Za-z0-9_-]+$/).withMessage('Code can only contain letters, numbers, underscores and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('discountType')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),

  body('discountValue')
    .notEmpty().withMessage('Discount value is required')
    .isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0'),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max discount must be a positive number'),

  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min order amount must be a positive number'),

  body('usageLimit')
    .optional()
    .isInt({ min: 0 }).withMessage('Usage limit must be a non-negative integer'),

  body('usageLimitPerUser')
    .optional()
    .isInt({ min: 1 }).withMessage('Usage limit per user must be at least 1'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),

  body('isGlobal')
    .optional()
    .isBoolean().withMessage('isGlobal must be a boolean'),

  body('seller')
    .optional()
    .isMongoId().withMessage('Invalid seller ID'),

  body('applicableProducts')
    .optional()
    .isArray().withMessage('applicableProducts must be an array'),

  body('applicableProducts.*')
    .isMongoId().withMessage('Invalid product ID'),

  body('applicableCategories')
    .optional()
    .isArray().withMessage('applicableCategories must be an array'),

  body('applicableCategories.*')
    .isMongoId().withMessage('Invalid category ID'),

  body('applicableProductTypes')
    .optional()
    .isArray().withMessage('applicableProductTypes must be an array'),

  body('applicableProductTypes.*')
    .isIn([
      'ebook', 'audiobook', 'video_course', 'course_bundle',
      'software', 'template', 'subscription',
      'new_book', 'book_combo', 'used_book',
    ]).withMessage('Invalid product type'),

  body('excludedProducts')
    .optional()
    .isArray().withMessage('excludedProducts must be an array'),

  body('excludedProducts.*')
    .isMongoId().withMessage('Invalid product ID'),

  body('validFrom')
    .notEmpty().withMessage('Valid from date is required')
    .isISO8601().withMessage('Valid from must be a valid date'),

  body('validUntil')
    .notEmpty().withMessage('Valid until date is required')
    .isISO8601().withMessage('Valid until must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Valid until must be after valid from');
      }
      return true;
    }),
];

const updateCouponValidator = [
  param('id').isMongoId().withMessage('Invalid coupon ID'),

  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Code must be between 3 and 50 characters')
    .matches(/^[A-Za-z0-9_-]+$/).withMessage('Code can only contain letters, numbers, underscores and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),

  body('discountValue')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0'),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max discount must be a positive number'),

  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Min order amount must be a positive number'),

  body('usageLimit')
    .optional()
    .isInt({ min: 0 }).withMessage('Usage limit must be a non-negative integer'),

  body('usageLimitPerUser')
    .optional()
    .isInt({ min: 1 }).withMessage('Usage limit per user must be at least 1'),

  body('isActive').optional().isBoolean(),
  body('isGlobal').optional().isBoolean(),
  body('seller').optional().isMongoId(),
  body('applicableProducts').optional().isArray(),
  body('applicableProducts.*').optional().isMongoId(),
  body('applicableCategories').optional().isArray(),
  body('applicableCategories.*').optional().isMongoId(),
  body('applicableProductTypes').optional().isArray(),
  body('excludedProducts').optional().isArray(),
  body('excludedProducts.*').optional().isMongoId(),

  body('validFrom')
    .optional()
    .isISO8601().withMessage('Valid from must be a valid date'),

  body('validUntil')
    .optional()
    .isISO8601().withMessage('Valid until must be a valid date'),
];

const validateCouponValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required'),

  body('cartTotal')
    .notEmpty().withMessage('Cart total is required')
    .isFloat({ min: 0 }).withMessage('Cart total must be a positive number'),

  body('productIds')
    .optional()
    .isArray().withMessage('Product IDs must be an array'),

  body('productIds.*')
    .optional()
    .isMongoId().withMessage('Invalid product ID'),

  body('categoryIds')
    .optional()
    .isArray().withMessage('Category IDs must be an array'),

  body('categoryIds.*')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),

  body('productTypes')
    .optional()
    .isArray().withMessage('Product types must be an array'),
];

const couponIdValidator = [
  param('id').isMongoId().withMessage('Invalid coupon ID'),
];

module.exports = {
  createCouponValidator,
  updateCouponValidator,
  validateCouponValidator,
  couponIdValidator,
};
