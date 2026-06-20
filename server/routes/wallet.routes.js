const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { addMoneyValidator, withdrawalRequestValidator, processWithdrawalValidator } = require('../validators/wallet.validator');
const {
  getWallet, getTransactions, addMoney,
  requestWithdrawal, getWithdrawals, cancelWithdrawal,
  getAllWithdrawalsAdmin, processWithdrawal,
  creditUserWallet, debitUserWallet,
} = require('../controllers/wallet.controller');

router.get('/', authenticate, getWallet);
router.get('/transactions', authenticate, getTransactions);
router.post('/add-money', authenticate, addMoneyValidator, validate, addMoney);
router.post('/withdraw', authenticate, withdrawalRequestValidator, validate, requestWithdrawal);
router.get('/withdrawals', authenticate, getWithdrawals);
router.put('/withdrawals/:id/cancel', authenticate, cancelWithdrawal);

router.get('/admin/withdrawals', authenticate, authorize('admin', 'super_admin'), getAllWithdrawalsAdmin);
router.put('/admin/withdrawals/:id/process', authenticate, authorize('admin', 'super_admin'), processWithdrawalValidator, validate, processWithdrawal);
router.post('/admin/credit', authenticate, authorize('admin', 'super_admin'), creditUserWallet);
router.post('/admin/debit', authenticate, authorize('admin', 'super_admin'), debitUserWallet);

module.exports = router;
