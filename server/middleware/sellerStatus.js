const ApiError = require('../utils/ApiError');

const requireSellerApproved = (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required');

  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }

  if (req.user.role !== 'seller') {
    throw ApiError.forbidden('Only sellers can access this resource');
  }

  if (req.user.sellerStatus === 'pending') {
    throw ApiError.forbidden('Please complete your KYC to access the seller dashboard');
  }

  if (req.user.sellerStatus === 'under_review') {
    throw ApiError.forbidden('Your KYC is under review. Please wait for approval.');
  }

  if (req.user.sellerStatus === 'rejected') {
    throw ApiError.forbidden(`Your seller application was rejected. Reason: ${req.user.sellerRejectionReason || 'N/A'}`);
  }

  if (req.user.sellerStatus === 'suspended') {
    throw ApiError.forbidden('Your seller account has been suspended');
  }

  if (!req.user.isSellerApproved) {
    throw ApiError.forbidden('Seller account not approved');
  }

  next();
};

const requireSellerKycSubmitted = (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required');

  if (req.user.role !== 'seller') {
    throw ApiError.forbidden('Only sellers can access this resource');
  }

  next();
};

module.exports = { requireSellerApproved, requireSellerKycSubmitted };
