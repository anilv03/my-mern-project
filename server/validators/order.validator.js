const { body, param } = require('express-validator');
const { ORDER_STATUS } = require('../constants/orderStatus');

const placeOrderValidator = [
  body('shippingAddress')
    .optional()
    .isObject().withMessage('Shipping address must be an object'),

  body('shippingAddress.fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name is required'),

  body('shippingAddress.phone')
    .optional()
    .trim()
    .notEmpty().withMessage('Phone number is required'),

  body('shippingAddress.street')
    .optional()
    .trim()
    .notEmpty().withMessage('Street address is required'),

  body('shippingAddress.city')
    .optional()
    .trim()
    .notEmpty().withMessage('City is required'),

  body('shippingAddress.state')
    .optional()
    .trim()
    .notEmpty().withMessage('State is required'),

  body('shippingAddress.zip')
    .optional()
    .trim()
    .notEmpty().withMessage('ZIP code is required'),

  body('billingAddress')
    .optional()
    .isObject().withMessage('Billing address must be an object'),

  body('paymentMethod')
    .optional()
    .isIn(['razorpay', 'stripe', 'cod', 'wallet']).withMessage('Invalid payment method'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const verifyPaymentValidator = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),

  body('razorpay_order_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Razorpay order ID is required'),

  body('razorpay_payment_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Razorpay payment ID is required'),

  body('razorpay_signature')
    .optional()
    .trim()
    .notEmpty().withMessage('Razorpay signature is required'),

  body('stripePaymentIntentId')
    .optional()
    .trim()
    .notEmpty().withMessage('Stripe payment intent ID is required'),
];

const cancelOrderValidator = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];

const updateStatusValidator = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),

  body('itemId')
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID'),

  body('status')
    .optional()
    .isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),

  body('deliveryStatus')
    .optional()
    .isIn(['not_shipped', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'])
    .withMessage('Invalid delivery status'),

  body('trackingNumber')
    .optional()
    .trim(),

  body('trackingUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid tracking URL'),

  body('estimatedDelivery')
    .optional()
    .isISO8601().withMessage('Invalid estimated delivery date'),
];

module.exports = {
  placeOrderValidator,
  verifyPaymentValidator,
  cancelOrderValidator,
  updateStatusValidator,
};
