const { body } = require('express-validator');
const User = require('../models/User');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error('Email already registered');
      return true;
    }),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const loginValidator = [
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Email or phone is required');
    }
    return true;
  }),
];

const sendEmailOtpValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('purpose')
    .optional()
    .isIn(['verification', 'login', 'password_reset', 'seller_kyc'])
    .withMessage('Invalid OTP purpose'),
];

const verifyEmailOtpValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const sendPhoneOtpValidator = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('purpose')
    .optional()
    .isIn(['verification', 'login', 'seller_kyc'])
    .withMessage('Invalid OTP purpose'),
];

const verifyPhoneOtpValidator = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
];

const sellerRegisterValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const sellerKycValidator = [
  body('legalName')
    .trim()
    .notEmpty().withMessage('Legal name is required'),

  body('fathersName')
    .trim()
    .notEmpty().withMessage('Father\'s name is required'),

  body('age')
    .notEmpty().withMessage('Age is required')
    .isInt({ min: 18, max: 120 }).withMessage('Age must be between 18 and 120'),

  body('panNumber')
    .trim()
    .notEmpty().withMessage('PAN number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please provide a valid PAN number'),

  body('panUrl')
    .notEmpty().withMessage('PAN card photo is required'),

  body('aadhaarNumber')
    .trim()
    .notEmpty().withMessage('Aadhaar number is required')
    .isLength({ min: 12, max: 12 }).withMessage('Aadhaar number must be 12 digits'),

  body('aadhaarFrontUrl')
    .notEmpty().withMessage('Aadhaar front photo is required'),

  body('aadhaarBackUrl')
    .notEmpty().withMessage('Aadhaar back photo is required'),

  body('selfieUrl')
    .notEmpty().withMessage('Selfie is required'),

  body('panPublicId')
    .optional({ values: 'falsy' }),

  body('aadhaarFrontPublicId')
    .optional({ values: 'falsy' }),

  body('aadhaarBackPublicId')
    .optional({ values: 'falsy' }),

  body('selfiePublicId')
    .optional({ values: 'falsy' }),

  body('address.street')
    .trim()
    .notEmpty().withMessage('Street address is required'),

  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('address.state')
    .trim()
    .notEmpty().withMessage('State is required'),

  body('address.zip')
    .trim()
    .notEmpty().withMessage('ZIP code is required'),

  body('gstNumber')
    .optional({ values: 'falsy' })
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Please provide a valid GST number'),

  body('gstUrl')
    .optional({ values: 'falsy' }),

  body('gstPublicId')
    .optional({ values: 'falsy' }),

  body('secondaryPhone')
    .optional({ values: 'falsy' })
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid secondary phone number'),

  body('secondaryPhoneOtp')
    .optional({ values: 'falsy' })
    .isLength({ min: 6, max: 6 }).withMessage('Secondary phone OTP must be 6 digits'),
];

module.exports = {
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
};
