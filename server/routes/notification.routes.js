const router = require('express').Router();
const authenticate = require('../middleware/auth');
const nc = require('../controllers/notification.controller');

router.get('/', authenticate, nc.getNotifications);
router.get('/unread-count', authenticate, nc.getUnreadCount);
router.patch('/:id/read', authenticate, nc.markAsRead);
router.patch('/read-all', authenticate, nc.markAllAsRead);
router.delete('/:id', authenticate, nc.deleteNotification);

module.exports = router;
