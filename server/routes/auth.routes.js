const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  sendEmailOtpValidator,
  verifyEmailOtpValidator,
  sendPhoneOtpValidator,
  verifyPhoneOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  sellerRegisterValidator,
  sellerKycValidator,
} = require('../validators/auth.validator');

// --- Customer Auth ---
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// --- Email OTP ---
router.post('/send-email-otp', sendEmailOtpValidator, validate, authController.sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtpValidator, validate, authController.verifyEmailOtp);

// --- Phone OTP ---
router.post('/send-phone-otp', sendPhoneOtpValidator, validate, authController.sendPhoneOtp);
router.post('/verify-phone-otp', verifyPhoneOtpValidator, validate, authController.verifyPhoneOtp);

// --- Password Reset ---
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

// --- Seller Auth ---
router.post('/seller/register', sellerRegisterValidator, validate, authController.sellerRegister);
router.post('/seller/kyc', authenticate, sellerKycValidator, validate, authController.submitKyc);
router.get('/seller/kyc-status', authenticate, authController.getKycStatus);
router.post('/seller/send-secondary-phone-otp', authenticate, authController.sendSecondaryPhoneOtp);

module.exports = router;
