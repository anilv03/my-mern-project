const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const getRazorpay = require('../config/razorpay');
const getStripe = require('../config/stripe');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, DELIVERY_STATUS, ORDER_TYPES } = require('../constants/orderStatus');
const { DIGITAL_PRODUCTS } = require('../constants/productTypes');
const referralService = require('../services/referralService');
const walletService = require('../services/walletService');
const logger = require('../utils/logger');

const generateOrderNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ZLN-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const determineOrderType = (items) => {
  const allDigital = items.every(item => DIGITAL_PRODUCTS.includes(item.product?.productType || item.productType || ''));
  const allPhysical = items.every(item => !DIGITAL_PRODUCTS.includes(item.product?.productType || item.productType || ''));
  if (allDigital) return ORDER_TYPES.DIGITAL;
  if (allPhysical) return ORDER_TYPES.PHYSICAL;
  return ORDER_TYPES.MIXED;
};

const processCartOrder = async (req, { paymentMethod } = {}) => {
  const { shippingAddress, billingAddress, notes } = req.body;
  const method = paymentMethod || req.body.paymentMethod || 'razorpay';

  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'title sku productType pricing.sellingPrice pricing.originalPrice inventory.quantity inventory.trackInventory settings.requiresShipping settings.isDownloadable deliveryType downloadAllowed streamOnly thumbnail images status');

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  const selectedItems = cart.items.filter(item => item.isSelected);
  if (selectedItems.length === 0) {
    throw ApiError.badRequest('No items selected in cart');
  }

  for (const item of selectedItems) {
    const product = item.product;
    if (!product || product.status !== 'published') {
      throw ApiError.badRequest(`Product "${product?.title || 'unknown'}" is not available`);
    }
    if (product.inventory.trackInventory && product.inventory.quantity < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.title}"`);
    }
  }

  let orderNumber;
  let orderNumberExists = true;
  while (orderNumberExists) {
    orderNumber = generateOrderNumber();
    orderNumberExists = await Order.findOne({ orderNumber });
  }

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = cart.coupon?.discount || 0;
  const total = Math.max(0, subtotal - couponDiscount);

  const orderType = determineOrderType(selectedItems);
  const isDigitalOnly = orderType === ORDER_TYPES.DIGITAL;

  const orderItems = selectedItems.map(item => ({
    product: item.product._id || item.product,
    variant: item.variant,
    seller: item.seller,
    title: item.product.title,
    sku: item.product.sku || '',
    quantity: item.quantity,
    price: item.price,
    discount: 0,
    tax: 0,
    total: item.price * item.quantity,
    status: isDigitalOnly ? ORDER_STATUS.DELIVERED : ORDER_STATUS.PENDING,
    deliveryStatus: isDigitalOnly ? DELIVERY_STATUS.DELIVERED : DELIVERY_STATUS.NOT_SHIPPED,
    isDownloaded: false,
    downloadLimit: isDigitalOnly ? (item.product.digitalFile?.downloadLimit || 0) : 0,
    downloadCount: 0,
    deliveredAt: isDigitalOnly ? new Date() : undefined,
  }));

  const orderStatus = isDigitalOnly ? ORDER_STATUS.DELIVERED : ORDER_STATUS.PENDING;

  const statusHistory = [{
    status: ORDER_STATUS.PENDING,
    timestamp: new Date(),
    note: 'Order placed',
  }];

  if (isDigitalOnly) {
    statusHistory.push({
      status: ORDER_STATUS.DELIVERED,
      timestamp: new Date(),
      note: 'Digital product auto-delivered',
    });
  }

  if (method === 'wallet') {
    const wallet = await walletService.getWalletBalance(req.user._id);
    if (wallet.balance < total) {
      throw ApiError.badRequest('Insufficient wallet balance');
    }
  }

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    buyerId: req.user._id,
    sellerId: selectedItems[0].seller,
    orderType,
    items: orderItems,
    shippingAddress: isDigitalOnly ? {} : (shippingAddress || {}),
    billingAddress: billingAddress || {},
    pricing: {
      subtotal,
      discount: 0,
      couponCode: cart.coupon?.code || undefined,
      couponDiscount,
      shipping: 0,
      tax: 0,
      platformFee: 0,
      total,
    },
    payment: {
      method,
      status: PAYMENT_STATUS.PENDING,
    },
    paymentStatus: PAYMENT_STATUS.PENDING,
    status: orderStatus,
    deliveryStatus: isDigitalOnly ? DELIVERY_STATUS.DELIVERED : DELIVERY_STATUS.NOT_SHIPPED,
    deliveredAt: isDigitalOnly ? new Date() : undefined,
    isDigitalOnly,
    statusHistory,
    notes: notes || undefined,
  });

  for (const item of selectedItems) {
    const product = item.product;
    if (product.inventory.trackInventory) {
      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          'inventory.quantity': -item.quantity,
          'sales.count': item.quantity,
          'sales.revenue': item.price * item.quantity,
        },
      });
    } else {
      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          'sales.count': item.quantity,
          'sales.revenue': item.price * item.quantity,
        },
      });
    }
  }

  if (cart.coupon) {
    await Coupon.findByIdAndUpdate(cart.coupon.couponId, {
      $inc: { usedCount: 1 },
    });
  }

  if (method === 'wallet' && isDigitalOnly) {
    await walletService.debitWallet({ userId: req.user._id, amount: total, type: 'order_purchase', description: `Payment for order ${orderNumber}` });
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.paymentStatus = PAYMENT_STATUS.CAPTURED;
    order.payment.method = PAYMENT_METHODS.WALLET;
    order.payment.transactionId = `WALLET-${orderNumber}`;
    order.payment.paidAt = new Date();
    await order.save();
  }

  if (method === 'cod' && isDigitalOnly) {
    order.payment.method = PAYMENT_METHODS.COD;
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.paymentStatus = PAYMENT_STATUS.CAPTURED;
    order.payment.paidAt = new Date();
    await order.save();
  }

  await Cart.findByIdAndDelete(cart._id);

  try {
    await referralService.creditSellerReferralCommission(order);
    await referralService.processFirstPurchaseReward(order, req.user._id);
  } catch (err) {
    logger.error('Referral commission processing failed:', err);
  }

  if (!isDigitalOnly) {
    const uniqueSellers = [...new Set(order.items.map(item => String(item.seller)))];
    for (const sellerId of uniqueSellers) {
      try {
        await Notification.create({
          recipient: sellerId,
          type: 'order_placed',
          title: 'New Order Received',
          message: `You have received a new order #${orderNumber} worth ₹${total.toLocaleString('en-IN')}`,
          data: { orderId: order._id, orderNumber },
          link: `/seller/orders`,
          priority: 'high',
        });
      } catch (err) {
        logger.error('Failed to send seller notification:', err);
      }
    }
  }

  return order;
};

const createOrder = asyncHandler(async (req, res) => {
  const order = await processCartOrder(req);
  res.status(201).json(ApiResponse.created(order, 'Order created successfully'));
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, stripePaymentIntentId } = req.body;

  if (!orderId) {
    throw ApiError.badRequest('Order ID is required');
  }

  const order = await Order.findById(orderId).populate('items.product', 'productType deliveryType');
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (String(order.user) !== String(req.user._id)) {
    throw ApiError.forbidden('Not authorized to verify payment for this order');
  }

  if (order.paymentStatus === PAYMENT_STATUS.CAPTURED) {
    return res.status(200).json(ApiResponse.success(order, 'Payment already verified'));
  }

  if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw ApiError.badRequest('Invalid payment signature');
    }

    order.payment.razorpayOrderId = razorpay_order_id;
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.transactionId = razorpay_payment_id;
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.paymentStatus = PAYMENT_STATUS.CAPTURED;
    order.payment.method = PAYMENT_METHODS.RAZORPAY;
    order.payment.paidAt = new Date();

    const payment = await Payment.findOne({ 'razorpay.orderId': razorpay_order_id });
    if (payment) {
      payment.razorpay.paymentId = razorpay_payment_id;
      payment.razorpay.signature = razorpay_signature;
      payment.status = PAYMENT_STATUS.CAPTURED;
      payment.gatewayResponse = { verified: true, verifiedAt: new Date() };
      await payment.save();
    }
  } else if (stripePaymentIntentId) {
    const paymentIntent = await getStripe().paymentIntents.retrieve(stripePaymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw ApiError.badRequest(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    order.payment.stripePaymentIntentId = stripePaymentIntentId;
    order.payment.transactionId = stripePaymentIntentId;
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.paymentStatus = PAYMENT_STATUS.CAPTURED;
    order.payment.method = PAYMENT_METHODS.STRIPE;
    order.payment.paidAt = new Date();

    const payment = await Payment.findOne({ 'stripe.paymentIntentId': stripePaymentIntentId });
    if (payment) {
      payment.stripe.paymentIntentId = stripePaymentIntentId;
      payment.status = PAYMENT_STATUS.CAPTURED;
      payment.stripe.chargeId = paymentIntent.latest_charge;
      payment.stripe.receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;
      payment.gatewayResponse = { status: paymentIntent.status, verifiedAt: new Date() };
      await payment.save();
    }
  } else {
    throw ApiError.badRequest('Payment verification details are required');
  }

  if (order.orderType === ORDER_TYPES.DIGITAL || order.isDigitalOnly) {
    order.status = ORDER_STATUS.DELIVERED;
    order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
    order.deliveredAt = new Date();
    order.items.forEach(item => {
      item.status = ORDER_STATUS.DELIVERED;
      item.deliveryStatus = DELIVERY_STATUS.DELIVERED;
      item.deliveredAt = new Date();
    });
    order.statusHistory.push({
      status: ORDER_STATUS.DELIVERED,
      timestamp: new Date(),
      note: 'Digital order completed automatically after successful payment',
    });
  } else if (order.status === ORDER_STATUS.PENDING) {
    order.status = ORDER_STATUS.CONFIRMED;
    order.statusHistory.push({
      status: ORDER_STATUS.CONFIRMED,
      timestamp: new Date(),
      note: 'Payment verified successfully',
    });
  }

  await order.save();

  res.status(200).json(ApiResponse.success(order, 'Payment verified successfully'));
});

const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, orderType, paymentStatus } = req.query;
  const filter = { user: req.user._id };

  if (status) filter.status = status;
  if (orderType) filter.orderType = orderType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product', 'title slug images thumbnail pricing.sellingPrice productType deliveryType downloadAllowed streamOnly'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(orders, 'Orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const buyAgain = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const originalOrder = await Order.findById(id)
    .populate('items.product', 'title slug productType pricing.sellingPrice inventory.quantity inventory.trackInventory status');

  if (!originalOrder) {
    throw ApiError.notFound('Order not found');
  }

  if (String(originalOrder.user) !== String(req.user._id)) {
    throw ApiError.forbidden('Not authorized to re-order this order');
  }

  const availableItems = originalOrder.items.filter(item => {
    const product = item.product;
    if (!product || product.status !== 'published') return false;
    if (product.inventory.trackInventory && product.inventory.quantity < 1) return false;
    return true;
  });

  if (availableItems.length === 0) {
    throw ApiError.badRequest('No available products to re-order');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.badRequest('Cart not found. Please add items to cart first.');
  }

  for (const item of availableItems) {
    const existingItem = cart.items.find(
      ci => String(ci.product) === String(item.product._id)
    );
    if (!existingItem) {
      cart.items.push({
        product: item.product._id,
        seller: item.seller,
        quantity: 1,
        price: item.product.pricing.sellingPrice,
        isSelected: true,
      });
    }
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'title slug images thumbnail pricing.sellingPrice productType deliveryType');

  res.status(200).json(ApiResponse.success(populatedCart, 'Items added to cart successfully'));
});

const placeOrder = asyncHandler(async (req, res) => {
  const order = await processCartOrder(req, { paymentMethod: 'cod' });
  res.status(201).json(ApiResponse.created(order, 'Order placed successfully'));
});

const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { user: req.user._id };

  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product', 'title slug images thumbnail pricing.sellingPrice productType'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(orders, 'Orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'title slug images thumbnail pricing.sellingPrice productType deliveryType downloadAllowed streamOnly digitalFile physicalDetails')
    .populate('items.seller', 'name avatar');

  if (!order) throw ApiError.notFound('Order not found');

  if (
    String(order.user) !== String(req.user._id) &&
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin'
  ) {
    const isSellerItem = order.items.some(
      item => String(item.seller) === String(req.user._id)
    );
    if (!isSellerItem) throw ApiError.forbidden('Not authorized to view this order');
  }

  res.status(200).json(ApiResponse.success(order, 'Order fetched successfully'));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('Not authorized to cancel this order');
  if (order.isDigitalOnly) throw ApiError.badRequest('Digital orders cannot be cancelled');

  const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
  if (!cancellableStatuses.includes(order.status)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        'inventory.quantity': item.quantity,
        'sales.count': -item.quantity,
        'sales.revenue': -(item.price * item.quantity),
      },
    });
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelReason = reason || 'Cancelled by user';
  order.cancelledBy = req.user._id;
  order.cancelledAt = new Date();
  order.statusHistory.push({
    status: ORDER_STATUS.CANCELLED,
    timestamp: new Date(),
    updatedBy: req.user._id,
    note: reason || 'Cancelled by user',
  });

  await order.save();

  res.status(200).json(ApiResponse.success(order, 'Order cancelled successfully'));
});

const requestReturn = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('Return reason is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('Not authorized');
  if (order.isDigitalOnly) throw ApiError.badRequest('Digital orders cannot be returned');

  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw ApiError.badRequest('Only delivered orders can be returned');
  }
  if (order.returnRequested) {
    throw ApiError.badRequest('Return already requested for this order');
  }

  order.returnRequested = true;
  order.returnReason = reason;
  order.returnStatus = 'requested';

  if (!order.returnWindowExpiresAt) {
    const thirtyDaysFromDelivery = new Date(order.deliveredAt || Date.now());
    thirtyDaysFromDelivery.setDate(thirtyDaysFromDelivery.getDate() + 30);
    order.returnWindowExpiresAt = thirtyDaysFromDelivery;
  }

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    updatedBy: req.user._id,
    note: `Return requested: ${reason}`,
  });

  await order.save();

  res.status(200).json(ApiResponse.success(order, 'Return request submitted successfully'));
});

const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const order = await Order.findOne({ orderNumber })
    .select('orderNumber status items.title items.quantity items.price items.status items.deliveryStatus items.trackingNumber items.estimatedDelivery items.deliveredAt pricing.total shippingAddress.createdAt updatedAt statusHistory');

  if (!order) throw ApiError.notFound('Order not found');

  res.status(200).json(ApiResponse.success(order, 'Order tracking info fetched successfully'));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemId, status, deliveryStatus, trackingNumber, trackingUrl, estimatedDelivery, cancelReason, rejectionReason } = req.body;

  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (itemId) {
    const item = order.items.id(itemId);
    if (!item) throw ApiError.notFound('Order item not found');

    if (String(item.seller) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw ApiError.forbidden('Not authorized to update this item');
    }

    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    };

    const currentStatus = item.status || ORDER_STATUS.PENDING;

    if (status && status !== currentStatus) {
      const allowed = validTransitions[currentStatus];
      if (!allowed || !allowed.includes(status)) {
        throw ApiError.badRequest(`Cannot transition from ${currentStatus} to ${status}`);
      }

      item.status = status;

      if (status === ORDER_STATUS.SHIPPED && trackingNumber) {
        item.trackingNumber = trackingNumber;
        if (trackingUrl) item.trackingUrl = trackingUrl;
        if (estimatedDelivery) item.estimatedDelivery = estimatedDelivery;
      }

      if (status === ORDER_STATUS.DELIVERED) {
        item.deliveryStatus = DELIVERY_STATUS.DELIVERED;
        item.deliveredAt = new Date();
        item.settlementTax = Math.round(item.total * 0.1 * 100) / 100;
        item.sellerEarning = Math.round((item.total - item.settlementTax) * 100) / 100;
        item.settlementStatus = 'pending';
        await walletService.holdSettlementAmount(item.seller, item.sellerEarning);
      }

      if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED) {
        item.cancelReason = cancelReason || rejectionReason || `${status} by seller`;
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            'inventory.quantity': item.quantity,
            'sales.count': -item.quantity,
            'sales.revenue': -(item.price * item.quantity),
          },
        });
      }

      if (status === ORDER_STATUS.CONFIRMED) {
        item.deliveryStatus = DELIVERY_STATUS.NOT_SHIPPED;
      }
    }

    if (deliveryStatus && !status) {
      item.deliveryStatus = deliveryStatus;
      if (deliveryStatus === DELIVERY_STATUS.DELIVERED) {
        item.deliveredAt = new Date();
      }
    }

    if (trackingNumber && !status) {
      item.trackingNumber = trackingNumber;
      if (trackingUrl) item.trackingUrl = trackingUrl;
    }

    const allItemStatuses = order.items.map(i => i.status);
    const anyRejected = allItemStatuses.some(s => s === ORDER_STATUS.REJECTED);
    const anyCancelled = allItemStatuses.some(s => s === ORDER_STATUS.CANCELLED);
    const allDelivered = allItemStatuses.every(s => s === ORDER_STATUS.DELIVERED);
    const allShipped = allItemStatuses.some(s => s === ORDER_STATUS.SHIPPED || s === ORDER_STATUS.DELIVERED);
    const allConfirmed = allItemStatuses.every(s =>
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(s)
    );

    if (allDelivered) {
      order.status = ORDER_STATUS.DELIVERED;
      order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
      order.deliveredAt = new Date();
    } else if (allShipped && order.status !== ORDER_STATUS.DELIVERED) {
      order.status = ORDER_STATUS.SHIPPED;
    } else if (allConfirmed && order.status === ORDER_STATUS.PENDING) {
      order.status = ORDER_STATUS.CONFIRMED;
    }

    if (anyRejected || anyCancelled) {
      if (order.items.every(i => i.status === ORDER_STATUS.REJECTED || i.status === ORDER_STATUS.CANCELLED)) {
        order.status = ORDER_STATUS.CANCELLED;
        order.cancelledAt = new Date();
        order.cancelledBy = req.user._id;
      }
    }

    const noteText = status
      ? `Item status updated to ${status}${rejectionReason ? `: ${rejectionReason}` : ''}${cancelReason ? `: ${cancelReason}` : ''}`
      : `Item delivery updated to ${deliveryStatus || 'updated'}`;

    order.statusHistory.push({
      status: status || deliveryStatus || item.status || order.status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: noteText,
    });
  } else {
    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    };

    const currentStatus = order.status;
    if (status && status !== currentStatus) {
      const allowed = validTransitions[currentStatus];
      if (!allowed || !allowed.includes(status)) {
        throw ApiError.badRequest(`Cannot transition order from ${currentStatus} to ${status}`);
      }

      if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              'inventory.quantity': item.quantity,
              'sales.count': -item.quantity,
              'sales.revenue': -(item.price * item.quantity),
            },
          });
        }
        order.cancelledAt = new Date();
        order.cancelledBy = req.user._id;
        order.cancelReason = cancelReason || rejectionReason || `${status} by seller`;
      }

      order.status = status;
      order.items.forEach(item => {
        item.status = status;
        if (status === ORDER_STATUS.DELIVERED) {
          item.deliveryStatus = DELIVERY_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        }
        if (status === ORDER_STATUS.CONFIRMED) {
          item.deliveryStatus = DELIVERY_STATUS.NOT_SHIPPED;
        }
        if (status === ORDER_STATUS.SHIPPED && trackingNumber) {
          item.trackingNumber = trackingNumber;
          if (trackingUrl) item.trackingUrl = trackingUrl;
          if (estimatedDelivery) item.estimatedDelivery = estimatedDelivery;
        }
      });

      if (status === ORDER_STATUS.DELIVERED) {
        order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
        order.deliveredAt = new Date();
      }

      const noteText = `Order status updated to ${status}${cancelReason ? `: ${cancelReason}` : ''}${rejectionReason ? `: ${rejectionReason}` : ''}`;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: noteText,
      });
    }

    if (trackingNumber && !status) {
      order.items.forEach(item => {
        if (String(item.seller) === String(req.user._id)) {
          item.trackingNumber = trackingNumber;
          if (trackingUrl) item.trackingUrl = trackingUrl;
        }
      });
    }
  }

  await order.save();

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone')
    .populate('items.product', 'title slug images thumbnail');

  res.status(200).json(ApiResponse.success(populatedOrder, 'Order status updated successfully'));
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { 'items.seller': req.user._id };

  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')
      .populate('items.product', 'title slug images thumbnail'),
    Order.countDocuments(filter),
  ]);

  const sellerOrders = orders.map(order => {
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.filter(
      item => String(item.seller) === String(req.user._id)
    );
    return orderObj;
  });

  res.status(200).json(
    ApiResponse.success(sellerOrders, 'Seller orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, from, to, q, orderType } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (orderType) filter.orderType = orderType;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (q) {
    filter.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')
      .populate('items.product', 'title slug')
      .populate('items.seller', 'name email'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success(orders, 'All orders fetched successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    })
  );
});

const generateShippingLabel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('items.product', 'title sku images thumbnail')
    .populate({
      path: 'items.seller',
      select: 'name phone address',
      populate: { path: 'sellerProfile', select: 'storeName storeAddress contactPhone' },
    });

  if (!order) throw ApiError.notFound('Order not found');

  const isSellerItem = order.items.some(item => String(item.seller._id) === String(req.user._id));
  if (
    String(order.user._id) !== String(req.user._id) &&
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin' &&
    !isSellerItem
  ) {
    throw ApiError.forbidden('Not authorized');
  }

  const sellerItems = order.items.filter(
    item => String(item.seller._id) === String(req.user._id) || req.user.role === 'admin' || req.user.role === 'super_admin'
  );

  if (sellerItems.length === 0) throw ApiError.notFound('No items belonging to you in this order');

  const firstSeller = sellerItems[0].seller;
  const sellerProfile = firstSeller.sellerProfile || {};
  const sellerAddress = firstSeller.address || {};

  res.json(ApiResponse.success({
    orderNumber: order.orderNumber,
    orderId: order._id,
    customer: {
      name: order.user.name,
      phone: order.user.phone || order.shippingAddress?.phone || '',
      address: order.shippingAddress || {},
    },
    seller: {
      name: sellerProfile.storeName || firstSeller.name,
      phone: sellerProfile.contactPhone || firstSeller.phone || '',
      address: sellerProfile.storeAddress || sellerAddress,
    },
    items: sellerItems.map(item => ({
      title: item.product?.title || item.title,
      sku: item.product?.sku || item.sku || '',
      quantity: item.quantity,
      price: item.price,
    })),
    pricing: order.pricing,
    createdAt: order.createdAt,
  }, 'Shipping label data generated'));
});

const generateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('items.product', 'title sku images thumbnail pricing')
    .populate('items.seller', 'name email')
    .populate({
      path: 'items.seller',
      select: 'name email',
      populate: { path: 'sellerProfile', select: 'storeName storeAddress contactEmail gstin' },
    });

  if (!order) throw ApiError.notFound('Order not found');

  const isSellerItem = order.items.some(item => String(item.seller._id) === String(req.user._id));
  if (
    String(order.user._id) !== String(req.user._id) &&
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin' &&
    !isSellerItem
  ) {
    throw ApiError.forbidden('Not authorized');
  }

  const sellerItems = order.items.filter(
    item => String(item.seller._id) === String(req.user._id) || req.user.role === 'admin' || req.user.role === 'super_admin'
  );

  const itemsData = sellerItems.length > 0 ? sellerItems : order.items;

  res.json(ApiResponse.success({
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customer: {
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone || '',
      billingAddress: order.billingAddress || {},
      shippingAddress: order.shippingAddress || {},
    },
    seller: order.items[0]?.seller ? {
      name: order.items[0].seller.sellerProfile?.storeName || order.items[0].seller.name,
      email: order.items[0].seller.email,
      gstin: order.items[0].seller.sellerProfile?.gstin || '',
      address: order.items[0].seller.sellerProfile?.storeAddress || {},
    } : null,
    items: itemsData.map(item => ({
      title: item.product?.title || item.title,
      sku: item.product?.sku || item.sku || '',
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
    pricing: order.pricing,
    payment: order.payment,
  }, 'Invoice data generated'));
});

module.exports = {
  createOrder,
  verifyPayment,
  getUserOrders,
  buyAgain,
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  trackOrder,
  updateOrderStatus,
  getSellerOrders,
  getAllOrders,
  generateShippingLabel,
  generateInvoice,
};
