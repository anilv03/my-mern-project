const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller');

router.use(authenticate, authorize('admin', 'super_admin'));

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/sellers', adminController.getSellers);
router.patch('/sellers/:id/approve', adminController.approveSeller);
router.get('/seller-verifications', adminController.getSellerVerifications);
router.get('/seller-verifications/:id', adminController.getSellerVerificationById);
router.patch('/seller-verifications/:id/verify', adminController.verifySellerKyc);
router.get('/products', adminController.getAdminProducts);
router.put('/products/:id', adminController.updateProduct);
router.patch('/products/:id/status', adminController.updateProductStatus);
router.get('/orders', adminController.getAdminOrders);
router.patch('/orders/:id', adminController.updateOrderStatus);
router.get('/seller-orders', adminController.getSellerOrders);
router.get('/users/:userId/purchases', adminController.getUserPurchases);

// Admin refund management
const refundController = require('../controllers/refund.controller');
router.get('/refunds', refundController.getRefundRequests);
router.post('/refunds/process', refundController.processRefund);
router.get('/payments', adminController.getPayments);
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/reviews', adminController.getReviews);
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);
router.get('/referral-analytics', adminController.getDashboard);
router.get('/reports/revenue', (req, res, next) => {
  const reportController = require('../controllers/report.controller');
  req.query = { ...req.query, type: 'revenue' };
  next();
}, (req, res) => {
  res.status(200).json({ success: true, data: { revenue: 0, orders: 0, growth: 0 } });
});
router.get('/support-tickets', (req, res) => {
  res.json(require('../utils/ApiResponse').success({ tickets: [], stats: { open: 0, resolved: 0, pending: 0 } }, 'Support tickets fetched'));
});
// Role Management
const roleController = require('../controllers/role.controller');
router.get('/roles', roleController.getRoles);
router.get('/roles/:id', roleController.getRole);
router.post('/roles', roleController.createRole);
router.put('/roles/:id', roleController.updateRole);
router.delete('/roles/:id', roleController.deleteRole);
router.get('/permissions', (req, res) => {
  const permissionGroups = [
    { group: 'Dashboard', key: 'dashboard', permissions: [{ key: 'view', label: 'View Dashboard' }] },
    { group: 'Users', key: 'users', permissions: [{ key: 'view', label: 'View Users' }, { key: 'create', label: 'Create Users' }, { key: 'edit', label: 'Edit Users' }, { key: 'delete', label: 'Delete Users' }] },
    { group: 'Sellers', key: 'sellers', permissions: [{ key: 'view', label: 'View Sellers' }, { key: 'approve', label: 'Approve/Reject Sellers' }, { key: 'suspend', label: 'Suspend/Restore Sellers' }] },
    { group: 'Products', key: 'products', permissions: [{ key: 'view', label: 'View Products' }, { key: 'approve', label: 'Approve/Reject Products' }, { key: 'manage', label: 'Manage Products' }] },
    { group: 'Orders', key: 'orders', permissions: [{ key: 'view', label: 'View Orders' }, { key: 'update', label: 'Update Order Status' }, { key: 'cancel', label: 'Cancel Orders' }] },
    { group: 'Coupons', key: 'coupons', permissions: [{ key: 'view', label: 'View Coupons' }, { key: 'create', label: 'Create Coupons' }, { key: 'delete', label: 'Delete Coupons' }] },
    { group: 'Refunds', key: 'refunds', permissions: [{ key: 'view', label: 'View Refunds' }, { key: 'approve', label: 'Approve/Reject Refunds' }] },
    { group: 'Wallet', key: 'wallet', permissions: [{ key: 'view', label: 'View Wallet' }, { key: 'credit', label: 'Credit Wallet' }, { key: 'debit', label: 'Debit Wallet' }] },
    { group: 'Withdrawals', key: 'withdrawals', permissions: [{ key: 'view', label: 'View Withdrawals' }, { key: 'approve', label: 'Approve/Reject Withdrawals' }] },
    { group: 'Referrals', key: 'referrals', permissions: [{ key: 'view', label: 'View Referral Analytics' }] },
    { group: 'Creator Program', key: 'creator_program', permissions: [{ key: 'view', label: 'View Rewards' }, { key: 'review', label: 'Review Rewards' }] },
    { group: 'CMS', key: 'cms', permissions: [{ key: 'view', label: 'View CMS' }, { key: 'create', label: 'Create Content' }, { key: 'edit', label: 'Edit Content' }, { key: 'delete', label: 'Delete Content' }] },
    { group: 'Flash Sales', key: 'flash_sales', permissions: [{ key: 'view', label: 'View Flash Sales' }, { key: 'create', label: 'Create Flash Sales' }, { key: 'edit', label: 'Edit Flash Sales' }, { key: 'delete', label: 'Delete Flash Sales' }] },
    { group: 'Reports', key: 'reports', permissions: [{ key: 'view', label: 'View Reports' }] },
    { group: 'Notifications', key: 'notifications', permissions: [{ key: 'view', label: 'View Notifications' }, { key: 'send', label: 'Send Notifications' }] },
    { group: 'Support Tickets', key: 'support_tickets', permissions: [{ key: 'view', label: 'View Tickets' }, { key: 'reply', label: 'Reply to Tickets' }, { key: 'assign', label: 'Assign Tickets' }, { key: 'close', label: 'Close/Reopen Tickets' }] },
    { group: 'Settings', key: 'settings', permissions: [{ key: 'view', label: 'View Settings' }, { key: 'edit', label: 'Edit Settings' }] },
    { group: 'Roles', key: 'roles', permissions: [{ key: 'view', label: 'View Roles' }, { key: 'create', label: 'Create Roles' }, { key: 'edit', label: 'Edit Roles' }, { key: 'delete', label: 'Delete Roles' }] },
  ];
  const allPermissions = permissionGroups.flatMap(g => g.permissions.map(p => `${g.key}.${p.key}`));
  res.json(require('../utils/ApiResponse').success({ permissionGroups, permissions: allPermissions }, 'Permissions fetched'));
});

router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// CMS
const cmsController = require('../controllers/cms.controller');
router.get('/cms/blogs', cmsController.getBlogs);
router.post('/cms/blogs', cmsController.createBlog);
router.put('/cms/blogs/:id', cmsController.updateBlog);
router.delete('/cms/blogs/:id', cmsController.deleteBlog);
router.get('/cms/pages', cmsController.getPages);
router.post('/cms/pages', cmsController.createPage);
router.put('/cms/pages/:id', cmsController.updatePage);
router.delete('/cms/pages/:id', cmsController.deletePage);

// Wallet Management
router.get('/wallet/transactions', authenticate, authorize('admin', 'super_admin'), require('../controllers/wallet.controller').getAllTransactionsAdmin);
router.get('/wallet/stats', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  const Wallet = require('../models/Wallet');
  const WalletTransaction = require('../models/WalletTransaction');
  const ApiResponse = require('../utils/ApiResponse');
  const stats = await Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: '$balance' }, totalCredited: { $sum: '$totalCredited' }, totalDebited: { $sum: '$totalDebited' }, totalWithdrawn: { $sum: '$totalWithdrawn' }, count: { $sum: 1 } } }]);
  const txStats = await WalletTransaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
  res.json(ApiResponse.success({ overview: stats[0] || {}, byType: txStats }));
});
// Product Approvals
router.get('/product-approvals', adminController.getProductApprovals);
router.post('/product-approvals/batch-approve', adminController.batchApproveProducts);
router.post('/product-approvals/batch-reject', adminController.batchRejectProducts);

// Settlement Payouts
router.get('/settlements/pending', adminController.getPendingSettlements);
router.put('/settlements/:orderId/items/:itemId/approve', adminController.approveSettlement);
router.get('/settlements/summary', adminController.getSettlementSummary);
router.get('/settlements/payouts', adminController.getPayouts);
router.post('/settlements/payouts', adminController.createPayout);
router.patch('/settlements/payouts/:id', adminController.processPayout);

// Withdrawal Management
router.get('/withdrawals', adminController.getAdminWithdrawals);
router.get('/withdrawals/stats', adminController.getWithdrawalStats);
router.patch('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.patch('/withdrawals/:id/reject', adminController.rejectWithdrawal);

// Referral Reward Management
router.get('/referral/pending-rewards', adminController.getPendingReferralRewards);
router.put('/referral/rewards/:id/approve', adminController.approveReferralReward);
router.put('/referral/rewards/:id/reject', adminController.rejectReferralReward);
// Seller Referral Trees
router.get('/sellers/referral-trees', adminController.getSellerReferralTrees);
// Creator Program Management
router.get('/creator-rewards', authenticate, authorize('admin', 'super_admin'), require('../controllers/creatorReward.controller').getAllRewardsAdmin);
router.put('/creator-rewards/:id/review', authenticate, authorize('admin', 'super_admin'), require('../controllers/creatorReward.controller').reviewReward);
// Notification management (admin can send notifications)
router.post('/notifications/send', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  const Notification = require('../models/Notification');
  const ApiResponse = require('../utils/ApiResponse');
  const { recipientId, type, title, message, link } = req.body;
  const notification = await Notification.create({ recipient: recipientId, type, title, message, link });
  res.status(201).json(ApiResponse.created(notification, 'Notification sent'));
});
router.get('/notifications', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  const Notification = require('../models/Notification');
  const ApiResponse = require('../utils/ApiResponse');
  const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 20; const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find().populate('recipient', 'name email').sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(),
  ]);
  res.json(ApiResponse.success({ notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

module.exports = router;
