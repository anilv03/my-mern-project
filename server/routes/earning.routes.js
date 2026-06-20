const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { getEarningDashboard, getAllTransactions } = require('../controllers/earning.controller');

router.get('/dashboard', authenticate, getEarningDashboard);
router.get('/transactions', authenticate, getAllTransactions);

module.exports = router;
