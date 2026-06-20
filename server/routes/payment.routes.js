const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const paymentController = require('../controllers/payment.controller');

router.post('/razorpay/create-order', authenticate, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', authenticate, paymentController.verifyRazorpayPayment);
router.post('/stripe/create-payment-intent', authenticate, paymentController.createStripePaymentIntent);
router.post('/stripe/verify', authenticate, paymentController.verifyStripePayment);
router.post('/refund', authenticate, authorize('admin', 'super_admin'), paymentController.processRefund);

router.post('/razorpay/webhook', paymentController.razorpayWebhook);
router.post('/stripe/webhook', paymentController.stripeWebhook);

module.exports = router;
