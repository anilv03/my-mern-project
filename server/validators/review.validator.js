const { body, param } = require('express-validator');

const createReviewValidator = [
  body('product')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),

  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('Images must be an array with max 10 items'),

  body('images.*.public_id')
    .optional()
    .isString(),

  body('images.*.url')
    .optional()
    .isURL(),
];

const updateReviewValidator = [
  param('id').isMongoId().withMessage('Invalid review ID'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),

  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('Images must be an array with max 10 items'),

  body('images.*.public_id')
    .optional()
    .isString(),

  body('images.*.url')
    .optional()
    .isURL(),
];

const reviewIdValidator = [
  param('id').isMongoId().withMessage('Invalid review ID'),
];

module.exports = {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
};
