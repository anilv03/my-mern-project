const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailOtp;
  delete obj.emailOtpExpires;
  delete obj.phoneOtp;
  delete obj.phoneOtpExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.kyc?.secondaryPhoneOtp;
  delete obj.kyc?.secondaryPhoneOtpExpires;
  delete obj.kyc?.panCard;
  delete obj.kyc?.aadhaarCard;
  delete obj.kyc?.selfie;
  delete obj.kyc?.gst;
  delete obj.kyc?.address;
  delete obj.address;
  if (obj.recentlyViewed && obj.recentlyViewed.length > 10) {
    obj.recentlyViewed = obj.recentlyViewed.slice(0, 10);
  }
  return obj;
};

module.exports = sanitizeUser;
