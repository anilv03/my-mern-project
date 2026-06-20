const router = require('express').Router();
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addItemValidator, updateItemValidator, applyCouponValidator } = require('../validators/cart.validator');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require('../controllers/cart.controller');

router.get('/', authenticate, getCart);
router.post('/items', authenticate, addItemValidator, validate, addItem);
router.patch('/items/:productId', authenticate, updateItemValidator, validate, updateItem);
router.delete('/items/:productId', authenticate, removeItem);
router.delete('/', authenticate, clearCart);
router.post('/apply-coupon', authenticate, applyCouponValidator, validate, applyCoupon);
router.delete('/remove-coupon', authenticate, removeCoupon);

module.exports = router;
