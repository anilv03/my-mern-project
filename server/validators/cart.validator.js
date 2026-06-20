const { body, param } = require('express-validator');

const addItemValidator = [
  body('product')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('variant')
    .optional()
    .isMongoId().withMessage('Invalid variant ID'),

  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt(),

  body('price')
    .exists().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number')
    .toFloat(),

  body('seller')
    .exists().withMessage('Seller ID is required')
    .isMongoId().withMessage('Invalid seller ID'),
];

const updateItemValidator = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt(),
];

const applyCouponValidator = [
  body('code')
    .notEmpty().withMessage('Coupon code is required')
    .trim()
    .isString().withMessage('Coupon code must be a string'),
];

module.exports = {
  addItemValidator,
  updateItemValidator,
  applyCouponValidator,
};
