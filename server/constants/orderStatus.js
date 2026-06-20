const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  FAILED: 'failed',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  COD: 'cod',
  WALLET: 'wallet',
};

const DELIVERY_STATUS = {
  NOT_SHIPPED: 'not_shipped',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
};

const ORDER_TYPES = {
  DIGITAL: 'digital',
  PHYSICAL: 'physical',
  MIXED: 'mixed',
};

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DELIVERY_STATUS,
  ORDER_TYPES,
};
