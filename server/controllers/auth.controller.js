const crypto = require('crypto');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail, sendSellerApprovalEmail } = require('../services/emailService');
const { sendOtpSms } = require('../services/smsService');
const { SELLER_STATUS } = require('../constants/sellerStatus');
const sanitizeUser = require('../utils/sanitizeUser');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

// ----------------------------------------------------------------
// CUSTOMER REGISTER
// ----------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, phone, role: 'customer' });

  const otp = user.createEmailOtp();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(email, otp, 'verification');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(201).json(ApiResponse.created({
    user: sanitizeUser(user),
    accessToken,
  }, 'Account created. Please verify your email.'));
});

// ----------------------------------------------------------------
// CUSTOMER LOGIN
// ----------------------------------------------------------------
  const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  let user;
  if (email) {
    user = await User.findOne({ email }).select('+password +refreshToken -recentlyViewed -wishlist');
  } else if (phone) {
    user = await User.findOne({ phone }).select('+password +refreshToken -recentlyViewed -wishlist');
  }

  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (!user.isActive) throw ApiError.forbidden('Account has been deactivated');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw ApiError.unauthorized('Invalid credentials');

  if (Array.isArray(user.address)) user.address = {};
  if (!user.metadata) user.metadata = {};

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = refreshToken;
  user.metadata.lastLoginAt = new Date();
  user.metadata.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.json(ApiResponse.success({
    user: sanitizeUser(user),
    accessToken,
  }, 'Login successful'));
});

// ----------------------------------------------------------------
// SEND EMAIL OTP
// ----------------------------------------------------------------
const sendEmailOtp = asyncHandler(async (req, res) => {
  const { email, purpose = 'verification' } = req.body;

  let user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email');

  if (purpose === 'verification' && user.isVerified) {
    throw ApiError.badRequest('Email already verified');
  }

  const otp = user.createEmailOtp();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(email, otp, purpose);

  res.json(ApiResponse.success(null, 'OTP sent to your email'));
});

// ----------------------------------------------------------------
// VERIFY EMAIL OTP
// ----------------------------------------------------------------
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email');

  const result = user.verifyEmailOtp(otp);
  if (!result.valid) throw ApiError.badRequest(result.message);

  await user.save({ validateBeforeSave: false });

  res.json(ApiResponse.success({ isVerified: true }, 'Email verified successfully'));
});

// ----------------------------------------------------------------
// SEND PHONE OTP
// ----------------------------------------------------------------
const sendPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, purpose = 'verification' } = req.body;

  let user = await User.findOne({ phone });
  if (!user) throw ApiError.notFound('No account found with this phone number');

  const otp = user.createPhoneOtp();
  await user.save({ validateBeforeSave: false });

  await sendOtpSms(phone, otp, purpose);

  res.json(ApiResponse.success(
    process.env.NODE_ENV === 'development' ? { otp } : null,
    'OTP sent to your phone'
  ));
});

// ----------------------------------------------------------------
// VERIFY PHONE OTP
// ----------------------------------------------------------------
const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone });
  if (!user) throw ApiError.notFound('No account found with this phone number');

  const result = user.verifyPhoneOtp(otp);
  if (!result.valid) throw ApiError.badRequest(result.message);

  await user.save({ validateBeforeSave: false });

  res.json(ApiResponse.success({ isPhoneVerified: true }, 'Phone verified successfully'));
});

// ----------------------------------------------------------------
// FORGOT PASSWORD
// ----------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email');

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
    res.json(ApiResponse.success(null, 'Password reset link sent to your email'));
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal('Failed to send reset email. Please try again.');
  }
});

// ----------------------------------------------------------------
// RESET PASSWORD
// ----------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;
  await user.save();

  res.json(ApiResponse.success(null, 'Password reset successfully'));
});

// ----------------------------------------------------------------
// REFRESH TOKEN
// ----------------------------------------------------------------
const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) throw ApiError.unauthorized('Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found');

  if (user.refreshToken !== incomingToken) {
    throw ApiError.unauthorized('Refresh token mismatch');
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.json(ApiResponse.success({ accessToken: newAccessToken }, 'Token refreshed'));
});

// ----------------------------------------------------------------
// LOGOUT
// ----------------------------------------------------------------
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  res.json(ApiResponse.success(null, 'Logged out successfully'));
});

// ----------------------------------------------------------------
// SELLER REGISTER
// ----------------------------------------------------------------
const sellerRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  let user = await User.findOne({ email }).select('+password');

  if (user) {
    if (user.role !== 'customer') throw ApiError.conflict('Email already registered as seller');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

    user.role = 'seller';
    user.sellerStatus = SELLER_STATUS.PENDING;
    user.sellerRequestedAt = new Date();
    user.isSellerApproved = false;
    user.phone = phone;
    user.name = name;
    await user.save();

    const otp = user.createEmailOtp();
    await user.save({ validateBeforeSave: false });
    await sendOtpEmail(email, otp, 'seller_kyc');

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json(ApiResponse.success({
      user: sanitizeUser(user),
      accessToken,
    }, 'Your customer account has been upgraded to seller. Please complete your KYC.'));
  }

  user = await User.create({
    name,
    email,
    phone,
    password,
    role: 'seller',
    isVerified: false,
    isPhoneVerified: false,
    sellerStatus: SELLER_STATUS.PENDING,
    sellerRequestedAt: new Date(),
  });

  const otp = user.createEmailOtp();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(email, otp, 'seller_kyc');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(201).json(ApiResponse.created({
    user: sanitizeUser(user),
    accessToken,
  }, 'Seller account created. Please complete your KYC.'));
});

// ----------------------------------------------------------------
// SELLER SUBMIT KYC
// ----------------------------------------------------------------
const submitKyc = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role !== 'seller' && user.role !== 'customer') {
    throw ApiError.forbidden('Only sellers can submit KYC');
  }

  const {
    legalName, fathersName, age,
    panNumber, panPublicId, panUrl,
    aadhaarNumber, aadhaarFrontPublicId, aadhaarFrontUrl,
    aadhaarBackPublicId, aadhaarBackUrl,
    selfiePublicId, selfieUrl,
    address,
    emailVerified, phoneVerified,
    gstNumber, gstPublicId, gstUrl,
    secondaryPhone, secondaryPhoneOtp,
  } = req.body;

  if (secondaryPhone && secondaryPhoneOtp) {
    const hashedOtp = crypto.createHash('sha256').update(secondaryPhoneOtp).digest('hex');
    if (
      !user.kyc?.secondaryPhoneOtp ||
      user.kyc.secondaryPhoneOtp !== hashedOtp ||
      Date.now() > (user.kyc.secondaryPhoneOtpExpires || 0)
    ) {
      throw ApiError.badRequest('Invalid or expired secondary phone OTP');
    }
  }

  user.kyc = {
    ...user.kyc,
    legalName,
    fathersName,
    age,
    phone: user.phone,
    emailVerified: !!emailVerified,
    phoneVerified: !!phoneVerified,
    panCard: {
      number: panNumber,
      public_id: panPublicId,
      url: panUrl,
      verified: false,
    },
    aadhaarCard: {
      number: aadhaarNumber,
      frontPublicId: aadhaarFrontPublicId,
      frontUrl: aadhaarFrontUrl,
      backPublicId: aadhaarBackPublicId,
      backUrl: aadhaarBackUrl,
      verified: false,
    },
    selfie: {
      public_id: selfiePublicId,
      url: selfieUrl,
      verified: false,
    },
    address: address || user.kyc?.address,
    gst: gstNumber ? {
      number: gstNumber,
      public_id: gstPublicId,
      url: gstUrl,
      verified: false,
    } : user.kyc?.gst,
    secondaryPhone: secondaryPhone || user.kyc?.secondaryPhone,
    submittedAt: new Date(),
    autoVerified: false,
  };

  user.sellerStatus = SELLER_STATUS.UNDER_REVIEW;
  user.isSellerApproved = false;

  user.markModified('kyc');

  await user.save();

  await sendSellerApprovalEmail(user.email, user.name, 'submitted');

  res.json(ApiResponse.success({
    user: sanitizeUser(user),
    sellerStatus: user.sellerStatus,
    isSellerApproved: user.isSellerApproved,
  }, 'KYC submitted successfully. It is under review and will be verified within 24 hours.'));
});

// ----------------------------------------------------------------
// GET KYC STATUS
// ----------------------------------------------------------------
const getKycStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  res.json(ApiResponse.success({
    sellerStatus: user.sellerStatus,
    isSellerApproved: user.isSellerApproved,
    kyc: {
      legalName: user.kyc?.legalName,
      panSubmitted: !!user.kyc?.panCard?.number,
      panVerified: user.kyc?.panCard?.verified,
      selfieSubmitted: !!user.kyc?.selfie?.url,
      selfieVerified: user.kyc?.selfie?.verified,
      gstSubmitted: !!user.kyc?.gst?.number,
      gstVerified: user.kyc?.gst?.verified,
      secondaryPhone: user.kyc?.secondaryPhone,
      submittedAt: user.kyc?.submittedAt,
      verifiedAt: user.kyc?.verifiedAt,
    },
    rejectionReason: user.sellerRejectionReason,
  }));
});

// ----------------------------------------------------------------
// RESEND KYC SECONDARY PHONE OTP
// ----------------------------------------------------------------
const sendSecondaryPhoneOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  if (!user.kyc) user.kyc = {};
  user.kyc.secondaryPhoneOtp = hashedOtp;
  user.kyc.secondaryPhoneOtpExpires = Date.now() + 10 * 60 * 1000;

  if (phone) user.kyc.secondaryPhone = phone;
  await user.save({ validateBeforeSave: false });

  await sendOtpSms(phone || user.kyc.secondaryPhone, otp, 'seller_kyc');

  res.json(ApiResponse.success(null, 'OTP sent to secondary phone'));
});

module.exports = {
  register,
  login,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  sellerRegister,
  submitKyc,
  getKycStatus,
  sendSecondaryPhoneOtp,
};
