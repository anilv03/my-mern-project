const router = require('express').Router();
const authenticate = require('../middleware/auth');
const ac = require('../controllers/access.controller');

router.get('/check/:productId', authenticate, ac.checkProductAccess);
router.get('/my-products', authenticate, ac.getMyProducts);

module.exports = router;
