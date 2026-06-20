const router = require('express').Router();
const authenticate = require('../middleware/auth');
const {
  getWishlist,
  addItem,
  removeItem,
  setPriceAlert,
} = require('../controllers/wishlist.controller');

router.get('/', authenticate, getWishlist);
router.post('/items/:productId', authenticate, addItem);
router.delete('/items/:productId', authenticate, removeItem);
router.post('/items/:productId/price-alert', authenticate, setPriceAlert);

module.exports = router;
