const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { requireSellerApproved } = require('../middleware/sellerStatus');
const sc = require('../controllers/seller.controller');
const wc = require('../controllers/wallet.controller');
const pc = require('../controllers/product.controller');
const oc = require('../controllers/order.controller');
const bac = require('../controllers/bankAccount.controller');

router.use(authenticate, requireSellerApproved);

router.get('/dashboard', sc.getDashboard);
router.get('/products', sc.getProducts);
router.get('/products/:id', pc.getProductById);
router.post('/products', pc.createProduct);
router.put('/products/:id', pc.updateProduct);
router.delete('/products/:id', pc.deleteProduct);
router.patch('/products/:id/submit', pc.submitProductForReview);
router.get('/orders', sc.getOrders);
router.patch('/orders/:id/status', oc.updateOrderStatus);
router.get('/orders/:id/shipping-label', oc.generateShippingLabel);
router.get('/orders/:id/invoice', oc.generateInvoice);
router.get('/earnings', sc.getEarnings);
router.get('/reviews', sc.getReviews);
router.get('/profile', sc.getProfile);
router.patch('/profile', sc.updateProfile);
router.get('/wallet', sc.getWallet);
router.get('/withdrawals', sc.getWithdrawals);
router.post('/withdrawals', sc.requestWithdrawal);
router.put('/withdrawals/:id/cancel', wc.cancelWithdrawal);
router.get('/analytics', sc.getAnalytics);
router.get('/settings', sc.getSettings);
router.patch('/settings', sc.updateSettings);
router.get('/referrals', sc.getReferrals);
router.get('/flash-sales', sc.getSellerFlashSales);
router.post('/flash-sales', sc.createSellerFlashSale);
router.put('/flash-sales/:id', sc.updateSellerFlashSale);
router.patch('/flash-sales/:id/toggle', sc.toggleSellerFlashSale);
router.delete('/flash-sales/:id', sc.deleteSellerFlashSale);

router.get('/bank-accounts', bac.getBankAccounts);
router.post('/bank-accounts', bac.createBankAccount);
router.put('/bank-accounts/:id', bac.updateBankAccount);
router.delete('/bank-accounts/:id', bac.deleteBankAccount);
router.patch('/bank-accounts/:id/default', bac.setDefaultBankAccount);

module.exports = router;
