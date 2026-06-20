const router = require('express').Router();
const pc = require('../controllers/public.controller');

router.get('/homepage', pc.getHomepageData);
router.get('/stats', pc.getHomepageStats);

module.exports = router;
