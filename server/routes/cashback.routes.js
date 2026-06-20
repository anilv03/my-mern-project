const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { updateCashbackSettingValidator } = require('../validators/cashback.validator');
const {
  getCashbackSettings, updateCashbackSettings,
  getUserCashbacks, getCashbackStats,
  getAllCashbacksAdmin,
} = require('../controllers/cashback.controller');

router.get('/settings', getCashbackSettings);

router.get('/', authenticate, getUserCashbacks);
router.get('/stats', authenticate, getCashbackStats);

router.put('/settings', authenticate, authorize('admin', 'super_admin'), updateCashbackSettingValidator, validate, updateCashbackSettings);
router.get('/admin/all', authenticate, authorize('admin', 'super_admin'), getAllCashbacksAdmin);

module.exports = router;
