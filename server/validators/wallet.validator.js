const { body, param } = require('express-validator');

const addMoneyValidator = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('paymentMethod')
    .isIn(['razorpay', 'stripe'])
    .withMessage('Invalid payment method'),
];

const withdrawalRequestValidator = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'upi', 'razorpay'])
    .withMessage('Invalid payment method'),
  body('bankDetails.accountHolderName')
    .if(body('paymentMethod').equals('bank_transfer'))
    .notEmpty().withMessage('Account holder name is required'),
  body('bankDetails.accountNumber')
    .if(body('paymentMethod').equals('bank_transfer'))
    .notEmpty().withMessage('Account number is required'),
  body('bankDetails.ifscCode')
    .if(body('paymentMethod').equals('bank_transfer'))
    .notEmpty().withMessage('IFSC code is required'),
  body('upiDetails.upiId')
    .if(body('paymentMethod').equals('upi'))
    .notEmpty().withMessage('UPI ID is required'),
];

const processWithdrawalValidator = [
  param('id').isMongoId().withMessage('Invalid withdrawal ID'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty().withMessage('Rejection reason is required'),
];

module.exports = {
  addMoneyValidator,
  withdrawalRequestValidator,
  processWithdrawalValidator,
};
