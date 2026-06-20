const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    commissionDeducted: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'razorpay'],
      required: true,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String,
    },
    orders: [
      {
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        amount: Number,
        commission: Number,
      },
    ],
    periodStart: Date,
    periodEnd: Date,
    requestedAt: Date,
    processedAt: Date,
    completedAt: Date,
    transactionReference: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    notes: String,
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
