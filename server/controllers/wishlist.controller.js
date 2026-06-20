const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const cache = require('../utils/cache');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const WISHLIST_CACHE_TTL = 2000;
const WISHLIST_POPULATE = {
  path: 'items.product',
  select: 'title slug pricing.sellingPrice pricing.originalPrice images ratings.average ratings.count status inventory.quantity wishlistCount seller',
  populate: { path: 'seller', select: 'name' },
};

const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await cache.wrap(`wishlist_${req.user._id}`, () =>
    Wishlist.findOne({ user: req.user._id })
      .populate(WISHLIST_POPULATE)
      .lean()
  , WISHLIST_CACHE_TTL);

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  const items = wishlist.items.filter(item => item.product != null);

  res.status(200).json(ApiResponse.success(items, 'Wishlist fetched successfully'));
});

const addItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId).select('status').lean();
  if (!product) throw ApiError.notFound('Product not found');

  let wishlist = await Wishlist.findOne({ user: userId }).lean();
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  const existingIndex = wishlist.items.findIndex(
    (item) => String(item.product) === productId
  );

  if (existingIndex > -1) {
    await Wishlist.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } });
  } else {
    await Wishlist.updateOne({ user: userId }, { $push: { items: { product: productId } } });
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });
  }

  cache.del(`wishlist_${userId}`);

  const updated = await Wishlist.findOne({ user: userId })
    .populate(WISHLIST_POPULATE)
    .lean();

  const items = updated.items.filter(item => item.product != null);
  res.status(200).json(ApiResponse.success(items, existingIndex > -1 ? 'Product removed from wishlist' : 'Product added to wishlist'));
});

const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId }).lean();
  if (!wishlist) throw ApiError.notFound('Wishlist not found');

  const existingIndex = wishlist.items.findIndex(
    (item) => String(item.product) === productId
  );

  if (existingIndex === -1) throw ApiError.notFound('Product not found in wishlist');

  await Wishlist.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
  await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } });

  cache.del(`wishlist_${userId}`);

  wishlist.items.splice(existingIndex, 1);
  res.status(200).json(ApiResponse.success(wishlist.items.filter(item => item.product != null), 'Product removed from wishlist'));
});

const setPriceAlert = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId).select('status').lean();
  if (!product) throw ApiError.notFound('Product not found');

  let wishlist = await Wishlist.findOne({ user: userId }).lean();
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  const item = wishlist.items.find(
    (item) => String(item.product) === productId
  );

  if (!item) {
    await Wishlist.updateOne({ user: userId }, { $push: { items: { product: productId, notifyOnPriceDrop: true } } });
    return res.status(200).json(ApiResponse.success({ notifyOnPriceDrop: true }, 'Price alert enabled'));
  }

  await Wishlist.updateOne(
    { user: userId, 'items.product': productId },
    { $set: { 'items.$.notifyOnPriceDrop': !item.notifyOnPriceDrop } }
  );

  res.status(200).json(
    ApiResponse.success(
      { notifyOnPriceDrop: item.notifyOnPriceDrop },
      item.notifyOnPriceDrop ? 'Price alert enabled' : 'Price alert disabled'
    )
  );
});

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  setPriceAlert,
};
