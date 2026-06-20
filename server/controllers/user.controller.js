const User = require('../models/User');
const ShippingAddress = require('../models/ShippingAddress');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeUser = require('../utils/sanitizeUser');

// ----------------------------------------------------------------
// GET PROFILE
// ----------------------------------------------------------------
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'title thumbnail pricing images.url status productType slug')
    .populate('recentlyViewed.product', 'title thumbnail pricing images.url status productType slug');

  if (!user) throw ApiError.notFound('User not found');

  res.json(ApiResponse.success(sanitizeUser(user)));
});

// ----------------------------------------------------------------
// UPDATE PROFILE
// ----------------------------------------------------------------
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, address } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;

  if (address) {
    user.address = {
      ...user.address,
      ...address,
    };
  }

  await user.save();

  res.json(ApiResponse.success(sanitizeUser(user), 'Profile updated successfully'));
});

// ----------------------------------------------------------------
// UPDATE PASSWORD
// ----------------------------------------------------------------
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  await user.save();

  res.json(ApiResponse.success(null, 'Password updated successfully'));
});

// ----------------------------------------------------------------
// DELETE ACCOUNT
// ----------------------------------------------------------------
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = false;
  user.email = `deleted_${user._id}@deleted.com`;
  user.phone = undefined;
  await user.save();

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json(ApiResponse.success(null, 'Account deleted successfully'));
});

// ----------------------------------------------------------------
// GET ADDRESSES
// ----------------------------------------------------------------
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await ShippingAddress.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json(ApiResponse.success(addresses));
});

// ----------------------------------------------------------------
// ADD ADDRESS
// ----------------------------------------------------------------
const addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, zip, country, addressType, isDefault, label, coordinates } = req.body;

  const addressCount = await ShippingAddress.countDocuments({ user: req.user._id });

  if (isDefault) {
    await ShippingAddress.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await ShippingAddress.create({
    user: req.user._id,
    fullName,
    phone,
    street,
    city,
    state,
    zip,
    country: country || 'India',
    addressType: addressType || 'home',
    isDefault: isDefault || addressCount === 0,
    label,
    coordinates,
  });

  res.status(201).json(ApiResponse.created(address, 'Address added successfully'));
});

// ----------------------------------------------------------------
// UPDATE ADDRESS
// ----------------------------------------------------------------
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const address = await ShippingAddress.findOne({ _id: id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');

  if (updates.isDefault) {
    await ShippingAddress.updateMany({ user: req.user._id, _id: { $ne: id } }, { isDefault: false });
  }

  Object.assign(address, updates);
  await address.save();

  res.json(ApiResponse.success(address, 'Address updated successfully'));
});

// ----------------------------------------------------------------
// DELETE ADDRESS
// ----------------------------------------------------------------
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await ShippingAddress.findOneAndDelete({ _id: id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found');

  if (address.isDefault) {
    const nextAddress = await ShippingAddress.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json(ApiResponse.success(null, 'Address deleted successfully'));
});

// ----------------------------------------------------------------
// UPDATE AVATAR
// ----------------------------------------------------------------
const updateAvatar = asyncHandler(async (req, res) => {
  const { public_id, url } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  user.avatar = { public_id, url };
  await user.save();

  res.json(ApiResponse.success(sanitizeUser(user), 'Avatar updated successfully'));
});

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateAvatar,
};
