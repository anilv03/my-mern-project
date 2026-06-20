const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  listProductsValidator,
} = require('../validators/product.validator');
const {
  getProducts,
  getDigitalProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  submitProductForReview,
  approveProduct,
  rejectProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
  getProductsBySeller,
} = require('../controllers/product.controller');

router.get('/', listProductsValidator, validate, getProducts);
router.get('/digital', getDigitalProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/seller/:sellerId', getProductsBySeller);
router.get('/slug/:slug', getProductBySlug);

router.get('/:id', productIdValidator, validate, getProductById);
router.get('/:id/related', productIdValidator, validate, getRelatedProducts);

router.post(
  '/',
  authenticate,
  authorize('seller'),
  createProductValidator,
  validate,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin', 'super_admin'),
  updateProductValidator,
  validate,
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('seller', 'admin', 'super_admin'),
  productIdValidator,
  validate,
  deleteProduct
);

router.patch(
  '/:id/submit',
  authenticate,
  authorize('seller'),
  productIdValidator,
  validate,
  submitProductForReview
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin', 'super_admin'),
  productIdValidator,
  validate,
  approveProduct
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize('admin', 'super_admin'),
  productIdValidator,
  validate,
  rejectProduct
);

module.exports = router;
