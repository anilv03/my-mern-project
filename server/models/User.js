const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES_ARRAY } = require('../constants/roles');
const { SELLER_STATUS_ARRAY } = require('../constants/sellerStatus');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ROLES_ARRAY,
      default: 'customer',
    },
    avatar: {
      public_id: String,
      url: { type: String, default: '' },
    },
    phone: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // --- Email OTP ---
    emailOtp: String,
    emailOtpExpires: Date,
    emailOtpAttempts: { type: Number, default: 0 },

    // --- Phone OTP ---
    phoneOtp: String,
    phoneOtpExpires: Date,
    phoneOtpAttempts: { type: Number, default: 0 },

    // --- Password Reset ---
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,

    // --- Refresh Token ---
    refreshToken: { type: String, select: false },

    // --- Seller Request / KYC ---
    sellerRequestedAt: Date,
    sellerApprovedAt: Date,
    sellerStatus: {
      type: String,
      enum: SELLER_STATUS_ARRAY,
      default: 'pending',
    },
    sellerRejectionReason: String,
    isSellerApproved: {
      type: Boolean,
      default: false,
    },

    // --- Seller KYC Fields ---
    kyc: {
      legalName: { type: String, trim: true },
      fathersName: { type: String, trim: true },
      age: { type: Number },
      phone: { type: String, trim: true },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      panCard: {
        number: String,
        public_id: String,
        url: String,
        verified: { type: Boolean, default: false },
      },
      aadhaarCard: {
        number: String,
        frontPublicId: String,
        frontUrl: String,
        backPublicId: String,
        backUrl: String,
        verified: { type: Boolean, default: false },
      },
      selfie: {
        public_id: String,
        url: String,
        verified: { type: Boolean, default: false },
      },
      gst: {
        number: String,
        public_id: String,
        url: String,
        verified: { type: Boolean, default: false },
      },
      secondaryPhone: {
        type: String,
        trim: true,
      },
      secondaryPhoneOtp: String,
      secondaryPhoneOtpExpires: Date,
      address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: { type: String, default: 'India' },
      },
      submittedAt: Date,
      verifiedAt: Date,
      autoVerified: { type: Boolean, default: false },
    },

    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'India' },
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    recentlyViewed: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },

    metadata: {
      signupIp: String,
      lastLoginIp: String,
      lastLoginAt: Date,
      userAgent: String,
      accountType: { type: String, enum: ['email', 'google', 'facebook'], default: 'email' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', function (next) {
  if (Array.isArray(this.address)) this.address = {};
  if (this.recentlyViewed && this.recentlyViewed.length > 50) {
    this.recentlyViewed = this.recentlyViewed.slice(-50);
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createEmailOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.emailOtpExpires = Date.now() + 10 * 60 * 1000;
  this.emailOtpAttempts = 0;
  return otp;
};

userSchema.methods.createPhoneOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.phoneOtpExpires = Date.now() + 10 * 60 * 1000;
  this.phoneOtpAttempts = 0;
  return otp;
};

userSchema.methods.verifyEmailOtp = function (otp) {
  if (this.emailOtpAttempts >= 5) return { valid: false, message: 'Too many attempts. Request a new OTP.' };
  if (Date.now() > this.emailOtpExpires) return { valid: false, message: 'OTP has expired.' };
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== this.emailOtp) {
    this.emailOtpAttempts += 1;
    return { valid: false, message: 'Invalid OTP.' };
  }
  this.emailOtp = undefined;
  this.emailOtpExpires = undefined;
  this.emailOtpAttempts = 0;
  this.isVerified = true;
  return { valid: true };
};

userSchema.methods.verifyPhoneOtp = function (otp) {
  if (this.phoneOtpAttempts >= 5) return { valid: false, message: 'Too many attempts. Request a new OTP.' };
  if (Date.now() > this.phoneOtpExpires) return { valid: false, message: 'OTP has expired.' };
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashed !== this.phoneOtp) {
    this.phoneOtpAttempts += 1;
    return { valid: false, message: 'Invalid OTP.' };
  }
  this.phoneOtp = undefined;
  this.phoneOtpExpires = undefined;
  this.phoneOtpAttempts = 0;
  this.isPhoneVerified = true;
  return { valid: true };
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.virtual('sellerProfile', {
  ref: 'SellerProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'user',
});

userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ sellerStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ role: 1, sellerStatus: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
