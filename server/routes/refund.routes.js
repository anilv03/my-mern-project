const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const rc = require('../controllers/refund.controller');

router.get('/stats', authenticate, authorize('admin', 'super_admin'), rc.getRefundStats);
router.get('/', authenticate, authorize('admin', 'super_admin'), rc.getRefundRequests);
router.post('/process', authenticate, authorize('admin', 'super_admin'), rc.processRefund);

module.exports = router;
