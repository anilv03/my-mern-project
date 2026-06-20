const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, ORDER_TYPES } = require('../constants/orderStatus');

const orderItemSubSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: Number,
    default: 0,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  sellerEarning: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  deliveryStatus: {
    type: String,
    enum: ['not_shipped', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
    default: 'not_shipped',
  },
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  isDownloaded: { type: Boolean, default: false },
  downloadLimit: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  digitalAccessExpiresAt: Date,
  settlementStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
  },
  settlementTax: {
    type: Number,
    default: 0,
  },
  settlementApprovedAt: Date,
  settlementApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.PHYSICAL,
    },
    items: [orderItemSubSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'India' },
      addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    },
    billingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'India' },
      gstin: String,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: String,
      couponDiscount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: Object.values(PAYMENT_METHODS),
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
      },
      transactionId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      stripePaymentIntentId: String,
      paidAt: Date,
      refundAmount: { type: Number, default: 0 },
      refundReason: String,
      refundedAt: Date,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],
    notes: String,
    isDigitalOnly: {
      type: Boolean,
      default: false,
    },
    deliveryStatus: {
      type: String,
      enum: ['not_shipped', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
      default: 'not_shipped',
    },
    trackingNumber: String,
    courier: String,
    deliveryInstructions: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnRequested: { type: Boolean, default: false },
    returnReason: String,
    returnStatus: {
      type: String,
      enum: ['not_requested', 'requested', 'approved', 'rejected', 'picked_up', 'returned', 'refunded'],
      default: 'not_requested',
    },
    returnWindowExpiresAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.virtual('total').get(function () {
  return this.pricing?.total || 0;
});

orderSchema.virtual('subtotal').get(function () {
  return this.pricing?.subtotal || 0;
});

orderSchema.virtual('discount').get(function () {
  return (this.pricing?.discount || 0) + (this.pricing?.couponDiscount || 0);
});

orderSchema.virtual('shipping').get(function () {
  return this.pricing?.shipping || 0;
});

orderSchema.virtual('tax').get(function () {
  return this.pricing?.tax || 0;
});

orderSchema.virtual('paymentMethod').get(function () {
  return this.payment?.method || '';
});

orderSchema.virtual('transactionId').get(function () {
  return this.payment?.transactionId || '';
});

orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ZLN-${timestamp}-${random}`;
  }
  this.paymentStatus = this.payment?.status || this.paymentStatus;
  if (this.items && this.items.length > 0) {
    this.buyerId = this.user;
    this.sellerId = this.items[0].seller;
  }
  if (this.items && this.items.length > 0) {
    const allDelivered = this.items.every(item => item.deliveryStatus === 'delivered');
    this.deliveryStatus = allDelivered ? 'delivered' : 'not_shipped';
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ 'payment.transactionId': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deliveryStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ returnRequested: 1, returnStatus: 1 });
orderSchema.index({ 'payment.status': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.index({ 'items.settlementStatus': 1, 'items.deliveryStatus': 1, 'items.deliveredAt': -1 });

module.exports = mongoose.model('Order', orderSchema);
