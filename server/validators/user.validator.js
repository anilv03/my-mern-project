const { body } = require('express-validator');

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('avatar')
    .optional({ values: 'falsy' }),

  body('address.street')
    .optional()
    .trim(),

  body('address.city')
    .optional()
    .trim(),

  body('address.state')
    .optional()
    .trim(),

  body('address.zip')
    .optional()
    .trim(),

  body('address.country')
    .optional()
    .trim(),
];

const updatePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) throw new Error('New password must be different from current password');
      return true;
    }),

  body('confirmNewPassword')
    .notEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('Passwords do not match');
      return true;
    }),
];

const addAddressValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+]?[\d\s()-]{10,15}$/).withMessage('Please provide a valid phone number'),

  body('street')
    .trim()
    .notEmpty().withMessage('Street address is required'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required'),

  body('zip')
    .trim()
    .notEmpty().withMessage('ZIP code is required'),

  body('addressType')
    .optional()
    .isIn(['home', 'work', 'other']).withMessage('Invalid address type'),

  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),
];

module.exports = {
  updateProfileValidator,
  updatePasswordValidator,
  addAddressValidator,
};
