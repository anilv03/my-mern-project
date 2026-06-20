const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const bc = require('../controllers/blog.controller');

router.get('/published', bc.getPublishedBlogs);
router.get('/featured', bc.getFeaturedBlogs);
router.get('/categories', bc.getBlogCategories);
router.get('/my', authenticate, bc.getMyBlogs);
router.get('/id/:id', authenticate, bc.getBlogById);
router.get('/:slug', bc.getBlogBySlug);
router.get('/', authenticate, authorize('admin', 'super_admin', 'seller'), bc.getAllBlogs);
router.post('/', authenticate, authorize('admin', 'super_admin', 'seller'), bc.createBlog);
router.put('/:id', authenticate, authorize('admin', 'super_admin', 'seller'), bc.updateBlog);
router.delete('/:id', authenticate, authorize('admin', 'super_admin', 'seller'), bc.deleteBlog);
router.post('/:id/comments', authenticate, bc.addComment);

module.exports = router;
