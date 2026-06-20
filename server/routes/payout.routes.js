const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const pc = require('../controllers/payout.controller');

router.get('/summary', authenticate, authorize('admin', 'super_admin'), pc.getSettlementSummary);
router.get('/', authenticate, authorize('admin', 'super_admin'), pc.getAllPayouts);
router.get('/:id', authenticate, authorize('admin', 'super_admin'), pc.getPayoutById);
router.post('/', authenticate, authorize('admin', 'super_admin'), pc.createPayout);
router.patch('/:id/process', authenticate, authorize('admin', 'super_admin'), pc.processPayout);

module.exports = router;
