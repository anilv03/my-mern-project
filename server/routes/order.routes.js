const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { placeOrderValidator, cancelOrderValidator, updateStatusValidator, verifyPaymentValidator } = require('../validators/order.validator');
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  buyAgain,
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  trackOrder,
  updateOrderStatus,
  getSellerOrders,
  getAllOrders,
} = require('../controllers/order.controller');

router.get('/seller', authenticate, authorize('seller'), getSellerOrders);
router.get('/admin', authenticate, authorize('admin', 'super_admin'), getAllOrders);

router.post('/', authenticate, placeOrderValidator, validate, createOrder);
router.post('/legacy', authenticate, placeOrderValidator, validate, placeOrder);
router.post('/verify-payment', authenticate, verifyPaymentValidator, validate, verifyPayment);
router.get('/', authenticate, getUserOrders);
router.get('/track/:orderNumber', trackOrder);
router.post('/:id/buy-again', authenticate, buyAgain);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/cancel', authenticate, cancelOrderValidator, validate, cancelOrder);
router.patch('/:id/return', authenticate, requestReturn);
router.patch('/:id/status', authenticate, authorize('seller', 'admin', 'super_admin'), updateStatusValidator, validate, updateOrderStatus);

module.exports = router;
