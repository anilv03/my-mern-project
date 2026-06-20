const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      unique: true,
      trim: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 0,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],
    applicableProductTypes: [
      {
        type: String,
        enum: [
          'ebook', 'audiobook', 'video_course', 'course_bundle',
          'software', 'template', 'subscription',
          'new_book', 'book_combo', 'used_book',
        ],
      },
    ],
    excludedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ seller: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
