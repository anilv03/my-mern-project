const WALLET_TRANSACTION_TYPES = {
  ADD_MONEY: 'add_money',
  ORDER_PURCHASE: 'order_purchase',
  ORDER_REFUND: 'order_refund',
  CASHBACK_CREDIT: 'cashback_credit',
  REFERRAL_COMMISSION: 'referral_commission',
  CREATOR_REWARD: 'creator_reward',
  WITHDRAWAL: 'withdrawal',
  WITHDRAWAL_REVERSAL: 'withdrawal_reversal',
  ADMIN_CREDIT: 'admin_credit',
  ADMIN_DEBIT: 'admin_debit',
  SELLER_SETTLEMENT: 'seller_settlement',
};

const WALLET_TRANSACTION_TYPES_ARRAY = Object.values(WALLET_TRANSACTION_TYPES);

const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const WITHDRAWAL_STATUS_ARRAY = Object.values(WITHDRAWAL_STATUS);

module.exports = {
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_TYPES_ARRAY,
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_ARRAY,
};
