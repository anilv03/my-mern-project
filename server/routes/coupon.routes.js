const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createCouponValidator,
  updateCouponValidator,
  validateCouponValidator,
  couponIdValidator,
} = require('../validators/coupon.validator');
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/coupon.controller');

router.post(
  '/validate',
  authenticate,
  validateCouponValidator,
  validate,
  validateCoupon
);

router.get(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  getCoupons
);

router.get(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  couponIdValidator,
  validate,
  getCouponById
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  createCouponValidator,
  validate,
  createCoupon
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  updateCouponValidator,
  validate,
  updateCoupon
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  couponIdValidator,
  validate,
  deleteCoupon
);

module.exports = router;
