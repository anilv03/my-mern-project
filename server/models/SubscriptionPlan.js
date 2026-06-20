const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    features: [
      {
        text: String,
        isIncluded: { type: Boolean, default: true },
      },
    ],
    pricing: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      halfYearly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
      lifetime: { type: Number, default: 0 },
    },
    billingIntervals: [
      {
        interval: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', 'lifetime'] },
        price: Number,
        discount: { type: Number, default: 0 },
        isPopular: { type: Boolean, default: false },
      },
    ],
    productAccess: {
      type: {
        type: String,
        enum: ['all', 'category', 'specific', 'seller'],
        default: 'all',
      },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      sellers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      maxDownloads: { type: Number, default: 0 },
      maxDevices: { type: Number, default: 3 },
      downloadSpeed: String,
      quality: { type: String, enum: ['sd', 'hd', 'fhd', '4k'], default: 'hd' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    trialDays: {
      type: Number,
      default: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
