const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const sc = require('../controllers/subscription.controller');

// Public
router.get('/plans', sc.getPlans);

// Authenticated
router.get('/my', authenticate, sc.getMySubscription);
router.post('/subscribe', authenticate, sc.subscribe);
router.patch('/:id/cancel', authenticate, sc.cancelSubscription);
router.patch('/:id/renew', authenticate, sc.renewSubscription);

// Admin
router.get('/admin', authenticate, authorize('admin', 'super_admin'), sc.getAllSubscriptions);
router.post('/plans', authenticate, authorize('admin', 'super_admin'), sc.createPlan);
router.put('/plans/:id', authenticate, authorize('admin', 'super_admin'), sc.updatePlan);
router.delete('/plans/:id', authenticate, authorize('admin', 'super_admin'), sc.deletePlan);

module.exports = router;
