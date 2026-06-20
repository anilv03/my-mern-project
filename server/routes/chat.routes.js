const router = require('express').Router();
const authenticate = require('../middleware/auth');
const chatController = require('../controllers/chat.controller');

router.use(authenticate);

router.get('/', chatController.getMyChats);
router.post('/', chatController.getOrCreateChat);
router.get('/:id', chatController.getChatById);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);
router.patch('/:id/read', chatController.markAsRead);
router.delete('/:id/messages/:messageId', chatController.deleteForMe);

module.exports = router;
