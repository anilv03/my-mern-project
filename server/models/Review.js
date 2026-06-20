const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    comment: {
      type: String,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    sellerReply: {
      comment: String,
      repliedAt: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        rating: Number,
        comment: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],
    reportedAsInappropriate: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Review', reviewSchema);
