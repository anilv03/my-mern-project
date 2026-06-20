const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      unique: true,
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    storeDescription: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    storeLogo: {
      public_id: String,
      url: String,
    },
    storeBanner: {
      public_id: String,
      url: String,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
    },
    contactPhone: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'India' },
    },
    taxInfo: {
      gstin: String,
      pan: String,
      businessRegistrationNumber: String,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
      upiId: String,
    },
    payoutPreferences: {
      minimumPayout: { type: Number, default: 100 },
      payoutFrequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'manual'],
        default: 'manual',
      },
      preferredMethod: {
        type: String,
        enum: ['bank_transfer', 'upi', 'razorpay'],
        default: 'bank_transfer',
      },
    },
    verificationDocuments: [
      {
        docType: { type: String, enum: ['identity', 'address', 'business', 'tax'] },
        public_id: String,
        url: String,
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'not_submitted'],
      default: 'not_submitted',
    },
    commissionRate: {
      type: Number,
      default: function () {
        return parseFloat(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 10;
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalPayouts: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    settings: {
      allowReviews: { type: Boolean, default: true },
      autoApproveOrders: { type: Boolean, default: false },
      notifyOnNewOrder: { type: Boolean, default: true },
      notifyOnCancellation: { type: Boolean, default: true },
      shippingDefaults: {
        shippingType: { type: String, enum: ['free', 'flat', 'calculated'], default: 'flat' },
        flatRate: { type: Number, default: 0 },
        freeShippingThreshold: { type: Number, default: 499 },
        estimatedDeliveryDays: { type: Number, default: 7 },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sellerProfileSchema.virtual('products', {
  ref: 'Product',
  localField: 'user',
  foreignField: 'seller',
});

sellerProfileSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
