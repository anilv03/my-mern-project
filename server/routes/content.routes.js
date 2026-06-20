const router = require('express').Router();
const authenticate = require('../middleware/auth');
const cc = require('../controllers/content.controller');

router.get('/library', authenticate, cc.getLibrary);
router.get('/courses', authenticate, cc.getCourses);
router.get('/courses/:productId', authenticate, cc.getCourseDetail);
router.get('/audio', authenticate, cc.getAudioBooks);
router.get('/audio/:productId', authenticate, cc.getAudioBookDetail);
router.get('/subscription', authenticate, cc.getSubscriptionDetail);
router.post('/download/:productId', authenticate, cc.downloadContent);
router.get('/download-history/:productId', authenticate, cc.getDownloadHistory);
router.patch('/progress/course/:productId', authenticate, cc.updateCourseProgress);
router.patch('/progress/audio/:productId', authenticate, cc.updateAudioProgress);
router.get('/signed-url/:productId', authenticate, cc.getSignedUrl);
router.get('/stream', cc.verifySignedUrl);
router.post('/subscription/:id/renew', authenticate, cc.renewSubscription);
router.post('/buy-again/:productId', authenticate, cc.buyAgain);

module.exports = router;
