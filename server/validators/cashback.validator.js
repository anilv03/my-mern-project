const { body } = require('express-validator');

const updateCashbackSettingValidator = [
  body('rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Rate must be between 0 and 100'),
  body('maxCashback')
    .isFloat({ min: 0 })
    .withMessage('Max cashback must be non-negative'),
  body('minOrderAmount')
    .isFloat({ min: 0 })
    .withMessage('Min order amount must be non-negative'),
];

module.exports = {
  updateCashbackSettingValidator,
};
