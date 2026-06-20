const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const getRazorpay = require('../config/razorpay');
const getStripe = require('../config/stripe');
const logger = require('../utils/logger');
const { PAYMENT_STATUS, PAYMENT_METHODS, ORDER_STATUS, DELIVERY_STATUS } = require('../constants/orderStatus');

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId, amount, currency = 'INR' } = req.body;

  if (!orderId || !amount) {
    throw ApiError.badRequest('Order ID and amount are required');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to pay for this order');
  }

  const razorpayInstance = getRazorpay();
  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  let payment = await Payment.findOne({ order: orderId });
  if (payment) {
    payment.razorpay.orderId = razorpayOrder.id;
    payment.amount = amount;
    payment.currency = currency;
    payment.method = PAYMENT_METHODS.RAZORPAY;
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
  } else {
    payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      method: PAYMENT_METHODS.RAZORPAY,
      status: PAYMENT_STATUS.PENDING,
      amount,
      currency,
      razorpay: { orderId: razorpayOrder.id },
    });
  }

  res.json(
    ApiResponse.success(
      {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      'Razorpay order created'
    )
  );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest('Missing Razorpay payment details');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw ApiError.badRequest('Invalid payment signature');
  }

  const payment = await Payment.findOne({ 'razorpay.orderId': razorpay_order_id });
  if (!payment) throw ApiError.notFound('Payment record not found');

  payment.razorpay.paymentId = razorpay_payment_id;
  payment.razorpay.signature = razorpay_signature;
  payment.status = PAYMENT_STATUS.CAPTURED;
  payment.gatewayResponse = { verified: true, verifiedAt: new Date() };
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.payment.transactionId = razorpay_payment_id;
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.paidAt = new Date();
    if (order.status === ORDER_STATUS.PENDING) {
      if (order.isDigitalOnly) {
        order.status = ORDER_STATUS.DELIVERED;
        order.deliveredAt = new Date();
        order.items.forEach(item => {
          item.status = ORDER_STATUS.DELIVERED;
          item.deliveryStatus = DELIVERY_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        });
        order.statusHistory.push({
          status: ORDER_STATUS.DELIVERED,
          timestamp: new Date(),
          note: 'Digital order completed automatically after payment via Razorpay',
        });
      } else {
        order.status = ORDER_STATUS.CONFIRMED;
        order.statusHistory.push({
          status: ORDER_STATUS.CONFIRMED,
          timestamp: new Date(),
          note: 'Payment verified via Razorpay',
        });
      }
    }
    await order.save();
  }

  res.json(
    ApiResponse.success(
      {
        paymentId: payment._id,
        status: payment.status,
      },
      'Payment verified successfully'
    )
  );
});

const createStripePaymentIntent = asyncHandler(async (req, res) => {
  const { orderId, amount, currency = 'usd' } = req.body;

  if (!orderId || !amount) {
    throw ApiError.badRequest('Order ID and amount are required');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to pay for this order');
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  let payment = await Payment.findOne({ order: orderId });
  if (payment) {
    payment.stripe.paymentIntentId = paymentIntent.id;
    payment.stripe.clientSecret = paymentIntent.client_secret;
    payment.amount = amount;
    payment.currency = currency;
    payment.method = PAYMENT_METHODS.STRIPE;
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
  } else {
    payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      method: PAYMENT_METHODS.STRIPE,
      status: PAYMENT_STATUS.PENDING,
      amount,
      currency,
      stripe: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    });
  }

  res.json(
    ApiResponse.success(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      'Stripe payment intent created'
    )
  );
});

const verifyStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    throw ApiError.badRequest('Payment intent ID is required');
  }

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw ApiError.badRequest(`Payment not completed. Status: ${paymentIntent.status}`);
  }

  const payment = await Payment.findOne({ 'stripe.paymentIntentId': paymentIntentId });
  if (!payment) throw ApiError.notFound('Payment record not found');

  payment.status = PAYMENT_STATUS.CAPTURED;
  payment.stripe.chargeId = paymentIntent.latest_charge;
  payment.stripe.receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;
  payment.gatewayResponse = { status: paymentIntent.status, verifiedAt: new Date() };
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment.status = PAYMENT_STATUS.CAPTURED;
    order.payment.transactionId = paymentIntentId;
    order.payment.stripePaymentIntentId = paymentIntentId;
    order.payment.paidAt = new Date();
    if (order.status === ORDER_STATUS.PENDING) {
      if (order.isDigitalOnly) {
        order.status = ORDER_STATUS.DELIVERED;
        order.deliveredAt = new Date();
        order.items.forEach(item => {
          item.status = ORDER_STATUS.DELIVERED;
          item.deliveryStatus = DELIVERY_STATUS.DELIVERED;
          item.deliveredAt = new Date();
        });
        order.statusHistory.push({
          status: ORDER_STATUS.DELIVERED,
          timestamp: new Date(),
          note: 'Digital order completed automatically after payment via Stripe',
        });
      } else {
        order.status = ORDER_STATUS.CONFIRMED;
        order.statusHistory.push({
          status: ORDER_STATUS.CONFIRMED,
          timestamp: new Date(),
          note: 'Payment confirmed via Stripe',
        });
      }
    }
    await order.save();
  }

  res.json(
    ApiResponse.success(
      {
        paymentId: payment._id,
        status: payment.status,
      },
      'Stripe payment verified'
    )
  );
});

const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;

  if (!paymentId) throw ApiError.badRequest('Payment ID is required');

  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== PAYMENT_STATUS.CAPTURED) {
    throw ApiError.badRequest('Payment cannot be refunded in its current state');
  }

  const refundAmount = amount || payment.amount;
  let gatewayRefundId;

  if (payment.method === PAYMENT_METHODS.RAZORPAY) {
    if (!payment.razorpay.paymentId) {
      throw ApiError.badRequest('No Razorpay payment ID found');
    }
    const refund = await getRazorpay().payments.refund(payment.razorpay.paymentId, {
      amount: Math.round(refundAmount * 100),
      notes: { reason: reason || 'Refund requested by admin' },
    });
    gatewayRefundId = refund.id;
  } else if (payment.method === PAYMENT_METHODS.STRIPE) {
    if (!payment.stripe.paymentIntentId) {
      throw ApiError.badRequest('No Stripe payment intent ID found');
    }
    const refund = await getStripe().refunds.create({
      payment_intent: payment.stripe.paymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: { reason: reason || 'Refund requested by admin' },
    });
    gatewayRefundId = refund.id;
  } else {
    throw ApiError.badRequest('Unsupported payment method for refund');
  }

  const isFullRefund = refundAmount >= payment.amount;
  payment.status = isFullRefund ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  payment.refund = {
    amount: refundAmount,
    reason: reason || 'Refund processed by admin',
    status: 'processed',
    initiatedBy: req.user._id,
    initiatedAt: new Date(),
    processedAt: new Date(),
    gatewayRefundId,
  };
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment.status = payment.status;
    order.payment.refundAmount = (order.payment.refundAmount || 0) + refundAmount;
    order.payment.refundReason = reason;
    order.payment.refundedAt = new Date();
    order.status = isFullRefund ? ORDER_STATUS.REFUNDED : ORDER_STATUS.PARTIALLY_REFUNDED;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Refund of ${refundAmount} processed. ${reason || ''}`,
    });
    await order.save();
  }

  res.json(
    ApiResponse.success(
      {
        paymentId: payment._id,
        refundAmount,
        refundStatus: payment.refund.status,
        gatewayRefundId,
      },
      'Refund processed successfully'
    )
  );
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    const actualSignature = req.headers['x-razorpay-signature'];
    if (expectedSignature !== actualSignature) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
  }
  logger.info('Razorpay webhook received:', { event: req.body.event });
  if (req.body.event === 'payment.captured') {
    const payment = await Payment.findOne({ gatewayPaymentId: req.body.payload.payment.entity.id });
    if (payment) {
      payment.status = PAYMENT_STATUS.COMPLETED;
      await payment.save();
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.COMPLETED, status: ORDER_STATUS.CONFIRMED });
    }
  }
  res.status(200).json({ status: 'ok' });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
  logger.info('Stripe webhook received:', { event: event.type });
  if (event.type === 'payment_intent.succeeded') {
    const payment = await Payment.findOne({ gatewayPaymentId: event.data.object.id });
    if (payment) {
      payment.status = PAYMENT_STATUS.COMPLETED;
      await payment.save();
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.COMPLETED, status: ORDER_STATUS.CONFIRMED });
    }
  }
  res.status(200).json({ received: true });
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripePaymentIntent,
  verifyStripePayment,
  processRefund,
  razorpayWebhook,
  stripeWebhook,
};
