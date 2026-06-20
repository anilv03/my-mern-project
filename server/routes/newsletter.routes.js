const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const nc = require('../controllers/newsletter.controller');

router.post('/subscribe', nc.subscribe);
router.get('/unsubscribe/:email', nc.unsubscribe);
router.get('/count', nc.getSubscriberCount);
router.get('/', authenticate, authorize('admin', 'super_admin'), nc.getAllSubscribers);

module.exports = router;
