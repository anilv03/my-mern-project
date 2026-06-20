const mongoose = require('mongoose');
const { WALLET_TRANSACTION_TYPES_ARRAY } = require('../constants/wallet');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: WALLET_TRANSACTION_TYPES_ARRAY,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      withdrawal: { type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawalRequest' },
      cashback: { type: mongoose.Schema.Types.ObjectId, ref: 'Cashback' },
      referralEarning: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralEarning' },
      creatorReward: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorReward' },
      paymentId: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'completed',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
