const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    const message = formattedErrors.map(e => e.message).join('; ');
    return next(new ApiError(422, message, formattedErrors));
  }
  next();
};

module.exports = validate;
