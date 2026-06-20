const SELLER_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const SELLER_STATUS_ARRAY = Object.values(SELLER_STATUS);

module.exports = { SELLER_STATUS, SELLER_STATUS_ARRAY };
