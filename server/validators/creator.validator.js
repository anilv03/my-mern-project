const { body, param } = require('express-validator');
const { CREATOR_CONTENT_TYPES } = require('../constants/creator');

const submitContentValidator = [
  body('contentType')
    .isIn(CREATOR_CONTENT_TYPES)
    .withMessage('Invalid content type'),
  body('contentUrl')
    .notEmpty().withMessage('Content URL is required')
    .isURL().withMessage('Invalid URL'),
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const reviewContentValidator = [
  param('id').isMongoId().withMessage('Invalid reward ID'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty().withMessage('Rejection reason is required'),
];

module.exports = {
  submitContentValidator,
  reviewContentValidator,
};
