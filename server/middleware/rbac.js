const { ROLE_HIERARCHY } = require('../constants/roles');
const ApiError = require('../utils/ApiError');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const hasRole = allowedRoles.some(role => req.user.role === role);
    if (!hasRole) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

const authorizeByHierarchy = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

const checkOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (
      req.user.role === 'admin' ||
      req.user.role === 'super_admin'
    ) {
      return next();
    }

    const resourceId = typeof resourceUserId === 'function'
      ? resourceUserId(req)
      : resourceUserId;

    if (req.user._id.toString() !== resourceId.toString()) {
      throw ApiError.forbidden('Not authorized to access this resource');
    }

    next();
  };
};

module.exports = { authorize, authorizeByHierarchy, checkOwnership };
