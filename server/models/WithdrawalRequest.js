const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS_ARRAY } = require('../constants/wallet');

const withdrawalRequestSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: WITHDRAWAL_STATUS_ARRAY,
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'razorpay'],
      required: true,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
    },
    upiDetails: {
      upiId: String,
      upiHolderName: String,
    },
    adminNote: String,
    userNote: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transactionId: String,
    receiptUrl: String,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

withdrawalRequestSchema.index({ user: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
