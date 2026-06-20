const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
} = require('../validators/category.validator');
const {
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
  getCategoryTree,
} = require('../controllers/category.controller');

router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:slug', getCategoryBySlug);
router.get('/:slug/products', getCategoryProducts);
router.get('/id/:id', categoryIdValidator, validate, getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  createCategoryValidator,
  validate,
  createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  updateCategoryValidator,
  validate,
  updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  categoryIdValidator,
  validate,
  deleteCategory
);

module.exports = router;
