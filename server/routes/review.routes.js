const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize, authorizeByHierarchy } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
} = require('../validators/review.validator');
const {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  markHelpful,
  sellerReply,
  approveReview,
  reportReview,
} = require('../controllers/review.controller');

router.get('/product/:productId', getProductReviews);

router.get('/my', authenticate, getMyReviews);

router.post(
  '/',
  authenticate,
  createReviewValidator,
  validate,
  createReview
);

router.patch(
  '/:id',
  authenticate,
  updateReviewValidator,
  validate,
  updateReview
);

router.delete(
  '/:id',
  authenticate,
  reviewIdValidator,
  validate,
  deleteReview
);

router.post(
  '/:id/helpful',
  authenticate,
  reviewIdValidator,
  validate,
  markHelpful
);

router.post(
  '/:id/reply',
  authenticate,
  authorizeByHierarchy('seller'),
  reviewIdValidator,
  validate,
  sellerReply
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin', 'super_admin'),
  reviewIdValidator,
  validate,
  approveReview
);

router.post(
  '/:id/report',
  authenticate,
  reviewIdValidator,
  validate,
  reportReview
);

module.exports = router;
