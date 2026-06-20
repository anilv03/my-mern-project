const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { submitContentValidator, reviewContentValidator } = require('../validators/creator.validator');
const {
  submitContent, getUserRewards, getRewardStats,
  getAllRewardsAdmin, reviewReward,
  getRewardSettings, updateRewardSettings,
} = require('../controllers/creatorReward.controller');

router.post('/', authenticate, submitContentValidator, validate, submitContent);
router.get('/', authenticate, getUserRewards);
router.get('/stats', authenticate, getRewardStats);

router.get('/settings', getRewardSettings);

router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), getAllRewardsAdmin);
router.put('/admin/:id/review', authenticate, authorize('admin', 'super_admin'), reviewContentValidator, validate, reviewReward);
router.put('/admin/settings', authenticate, authorize('admin', 'super_admin'), updateRewardSettings);

module.exports = router;
