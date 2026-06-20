const router = require('express').Router();
const authenticate = require('../middleware/auth');
const shippingController = require('../controllers/shipping.controller');

router.use(authenticate);

router.get('/', shippingController.getShipments);
router.post('/', shippingController.createShipment);
router.get('/:id', shippingController.getShipmentById);
router.get('/:id/track', shippingController.trackShipment);
router.patch('/:id/track', shippingController.updateTracking);
router.get('/:id/label', shippingController.getLabel);
router.delete('/:id', shippingController.cancelShipment);

module.exports = router;
