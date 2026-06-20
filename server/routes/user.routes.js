const router = require('express').Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateProfileValidator,
  updatePasswordValidator,
  addAddressValidator,
} = require('../validators/user.validator');

router.use(authenticate);

// --- Profile ---
router.get('/profile', userController.getProfile);
router.patch('/profile', updateProfileValidator, validate, userController.updateProfile);
router.patch('/avatar', userController.updateAvatar);
router.patch('/password', updatePasswordValidator, validate, userController.updatePassword);
router.delete('/account', userController.deleteAccount);

// --- Addresses ---
router.get('/addresses', userController.getAddresses);
router.post('/addresses', addAddressValidator, validate, userController.addAddress);
router.patch('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

module.exports = router;
