const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');

const CART_CACHE_TTL = 2000;

const getCart = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const cart = await cache.wrap(`cart_${userId}`, () =>
    Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title slug pricing.sellingPrice pricing.originalPrice images status inventory.quantity')
      .populate('items.seller', 'name')
      .populate('coupon.couponId')
      .lean()
  , CART_CACHE_TTL);

  if (!cart) {
    return res.status(200).json(ApiResponse.success({ items: [], subtotal: 0, totalItems: 0 }, 'Cart is empty'));
  }

  res.status(200).json(ApiResponse.success(cart, 'Cart fetched successfully'));
});

const addItem = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'development') logger.debug('[addItem] body:', JSON.stringify(req.body, null, 2));
  const { product: productId, variant, quantity = 1, price, seller } = req.body;

  if (price == null) throw ApiError.badRequest('Price is required');
  if (!seller) throw ApiError.badRequest('Seller ID is required');

  const product = await Product.findById(productId).select('status inventory.trackInventory inventory.quantity').lean();
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'published') throw ApiError.badRequest('Product is not available');

  if (product.inventory?.trackInventory && product.inventory.quantity < quantity) {
    throw ApiError.badRequest('Insufficient stock');
  }

  let cart = await Cart.findOne({ user: req.user._id }).lean();

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, variant, quantity, price, seller }],
    });
    cache.set(`cart_${req.user._id}`, cart, CART_CACHE_TTL);
    return res.status(201).json(ApiResponse.created(cart, 'Item added to cart'));
  }

  const existingIndex = cart.items.findIndex(
    item => item.product.toString() === productId && (!variant || String(item.variant) === String(variant))
  );

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (product.inventory.trackInventory && product.inventory.quantity < newQty) {
      throw ApiError.badRequest('Insufficient stock for requested quantity');
    }
    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].price = price ?? cart.items[existingIndex].price;
    cart = await Cart.findOneAndUpdate(
      { _id: cart._id, 'items.product': productId },
      {
        $set: { 'items.$.quantity': newQty, 'items.$.price': price ?? cart.items[existingIndex].price },
        $unset: { coupon: '' },
      },
      { new: true }
    ).populate('items.product', 'title slug pricing.sellingPrice images status')
     .populate('items.seller', 'name');
  } else {
    cart = await Cart.findOneAndUpdate(
      { _id: cart._id },
      {
        $push: { items: { product: productId, variant, quantity, price, seller } },
        $unset: { coupon: '' },
      },
      { new: true }
    ).populate('items.product', 'title slug pricing.sellingPrice images status')
     .populate('items.seller', 'name');
  }

  cache.set(`cart_${req.user._id}`, cart, CART_CACHE_TTL);
  res.status(200).json(ApiResponse.success(cart, 'Item added to cart'));
});

const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) throw ApiError.badRequest('Quantity must be at least 1');

  const product = await Product.findById(productId).select('status inventory.trackInventory inventory.quantity').lean();
  if (!product) throw ApiError.notFound('Product not found');

  if (product.inventory?.trackInventory && product.inventory.quantity < quantity) {
    throw ApiError.badRequest('Insufficient stock');
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, 'items.product': productId },
    { $set: { 'items.$.quantity': quantity }, $unset: { coupon: '' } },
    { new: true }
  ).populate('items.product', 'title slug pricing.sellingPrice images status')
   .populate('items.seller', 'name');

  if (!cart) throw ApiError.notFound('Item not found in cart');

  cache.set(`cart_${req.user._id}`, cart, CART_CACHE_TTL);
  res.status(200).json(ApiResponse.success(cart, 'Cart item updated'));
});

const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { product: productId } }, $unset: { coupon: '' } },
    { new: true }
  ).populate('items.product', 'title slug pricing.sellingPrice images status')
   .populate('items.seller', 'name');

  if (!cart) throw ApiError.notFound('Cart not found');
  const stillHasItem = cart.items.some(item => item.product.toString() === productId);
  if (stillHasItem) throw ApiError.notFound('Item not found in cart');

  cache.set(`cart_${req.user._id}`, cart, CART_CACHE_TTL);
  res.status(200).json(ApiResponse.success(cart, 'Item removed from cart'));
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndDelete({ user: req.user._id });
  if (!cart) throw ApiError.notFound('Cart not found');

  cache.del(`cart_${req.user._id}`);
  res.status(200).json(ApiResponse.success(null, 'Cart cleared successfully'));
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw ApiError.badRequest('Coupon code is required');

  const cart = await Cart.findOne({ user: req.user._id }).lean();
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
  if (!coupon) throw ApiError.notFound('Coupon not found');
  if (!coupon.isActive) throw ApiError.badRequest('Coupon is no longer active');

  const now = new Date();
  if (now < coupon.validFrom) throw ApiError.badRequest('Coupon is not yet valid');
  if (now > coupon.validUntil) throw ApiError.badRequest('Coupon has expired');

  const subtotal = cart.subtotal;
  if (subtotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(`Minimum order amount of ${coupon.minOrderAmount} required for this coupon`);
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('Coupon usage limit reached');
  }

  if (coupon.usageLimitPerUser > 0) {
    const Order = require('../models/Order');
    const userUsageCount = await Order.countDocuments({
      user: req.user._id,
      'pricing.couponCode': coupon.code,
    });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      throw ApiError.badRequest('You have already used this coupon');
    }
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  if (discount > subtotal) discount = subtotal;

  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        coupon: { code: coupon.code, discount, discountType: coupon.discountType, couponId: coupon._id },
      },
    },
    { new: true }
  ).populate('items.product', 'title slug pricing.sellingPrice images status')
   .populate('items.seller', 'name')
   .populate('coupon.couponId');

  if (updatedCart) cache.set(`cart_${req.user._id}`, updatedCart, CART_CACHE_TTL);
  res.status(200).json(ApiResponse.success(updatedCart, 'Coupon applied successfully'));
});

const removeCoupon = asyncHandler(async (req, res) => {
  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $unset: { coupon: '' } },
    { new: true }
  ).populate('items.product', 'title slug pricing.sellingPrice images status')
   .populate('items.seller', 'name');

  if (!updatedCart) throw ApiError.notFound('Cart not found');
  if (!updatedCart.coupon) throw ApiError.badRequest('No coupon applied');

  cache.set(`cart_${req.user._id}`, updatedCart, CART_CACHE_TTL);
  res.status(200).json(ApiResponse.success(updatedCart, 'Coupon removed successfully'));
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
};
