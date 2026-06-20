const CASHBACK_STATUS = {
  PENDING: 'pending',
  CREDITED: 'credited',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const CASHBACK_STATUS_ARRAY = Object.values(CASHBACK_STATUS);

const CASHBACK_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

const CASHBACK_TYPE_ARRAY = Object.values(CASHBACK_TYPE);

module.exports = {
  CASHBACK_STATUS,
  CASHBACK_STATUS_ARRAY,
  CASHBACK_TYPE,
  CASHBACK_TYPE_ARRAY,
};
