const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { applyReferralValidator } = require('../validators/referral.validator');
const {
  getReferralInfo, getTeamTree, getReferralEarnings,
  applyReferralCode, getReferralLeaderboard, getReferralStats,
} = require('../controllers/referral.controller');

router.get('/leaderboard', getReferralLeaderboard);

router.get('/', authenticate, getReferralInfo);
router.get('/tree', authenticate, getTeamTree);
router.get('/earnings', authenticate, getReferralEarnings);
router.get('/stats', authenticate, getReferralStats);
router.post('/apply', authenticate, applyReferralValidator, validate, applyReferralCode);

router.get('/admin/analytics', authenticate, authorize('admin', 'super_admin'), require('../controllers/referral.controller').getReferralAnalytics);

module.exports = router;
