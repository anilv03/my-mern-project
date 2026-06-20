const { body } = require('express-validator');

const applyReferralValidator = [
  body('referralCode')
    .notEmpty().withMessage('Referral code is required')
    .isString().withMessage('Invalid referral code'),
];

module.exports = {
  applyReferralValidator,
};
