const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const fc = require('../controllers/flashSale.controller');

router.get('/active', fc.getActiveFlashSales);
router.get('/:slug', fc.getFlashSaleBySlug);
router.get('/', authenticate, authorize('admin', 'super_admin'), fc.getAllFlashSales);
router.post('/', authenticate, authorize('admin', 'super_admin'), fc.createFlashSale);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), fc.updateFlashSale);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), fc.deleteFlashSale);
router.patch('/:id/toggle', authenticate, authorize('admin', 'super_admin'), fc.toggleFlashSale);

module.exports = router;
