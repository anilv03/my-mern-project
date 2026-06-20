const REFERRAL_LEVELS = [
  { level: 1, commissionRate: 5 },
  { level: 2, commissionRate: 2 },
  { level: 3, commissionRate: 1 },
  { level: 4, commissionRate: 0.3 },
  { level: 5, commissionRate: 0.01 },
];

const REFERRAL_COMMISSION_TYPES = {
  ORDER_COMMISSION: 'order_commission',
  CASHBACK_COMMISSION: 'cashback_commission',
  FIRST_PURCHASE_REWARD: 'first_purchase_reward',
};

const REFERRAL_REWARDS = {
  FIRST_PURCHASE_AMOUNT: 50,
  MINIMUM_ORDER_TOTAL: 100,
};

const REFERRAL_COMMISSION_TYPES_ARRAY = Object.values(REFERRAL_COMMISSION_TYPES);

module.exports = {
  REFERRAL_LEVELS,
  REFERRAL_COMMISSION_TYPES,
  REFERRAL_COMMISSION_TYPES_ARRAY,
  REFERRAL_REWARDS,
};
