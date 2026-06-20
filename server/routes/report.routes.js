const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const rc = require('../controllers/report.controller');

router.get('/revenue', authenticate, authorize('admin', 'super_admin'), rc.getRevenueReport);
router.get('/products', authenticate, authorize('admin', 'super_admin'), rc.getProductReport);
router.get('/users', authenticate, authorize('admin', 'super_admin'), rc.getUserReport);
router.get('/financial', authenticate, authorize('admin', 'super_admin'), rc.getFinancialReport);

module.exports = router;
