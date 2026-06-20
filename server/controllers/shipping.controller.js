const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getShippingProvider } = require('../services/shippingService');

exports.createShipment = asyncHandler(async (req, res) => {
  const { orderId, items, weight, dimensions, declaredValue, isCod, pickup } = req.body;
  const order = await Order.findOne({ _id: orderId, 'items.seller': req.user.id });
  if (!order) throw ApiError.notFound('Order not found');

  const provider = getShippingProvider();
  const shipmentData = {
    order_id: order.orderNumber,
    order_date: order.createdAt,
    pickup_city: pickup?.city || '',
    pickup_pincode: pickup?.pincode || '',
    billing_city: order.shippingAddress?.city || '',
    billing_pincode: order.shippingAddress?.pincode || '',
    billing_address: `${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.addressLine2 || ''}`.trim(),
    billing_name: order.shippingAddress?.name || order.shippingAddress?.fullName || '',
    billing_phone: order.shippingAddress?.phone || order.shippingAddress?.mobile || '',
    billing_email: req.user.email,
    shipping_is_billing: true,
    order_items: (items || order.items.filter(i => i.seller.toString() === req.user.id)).map(item => ({
      name: item.product?.name || item.name || 'Item',
      quantity: item.quantity || 1,
      price: item.price || 0,
    })),
    payment_method: isCod ? 'COD' : 'Prepaid',
    weight: weight || 0.5,
    dimensions: dimensions || { length: 10, width: 10, height: 10 },
  };

  const result = await provider.createShipment(shipmentData);

  const shipmentItems = items || order.items.filter(i => i.seller.toString() === req.user.id).map(i => i._id);
  const shipment = await Shipment.create({
    order: orderId,
    seller: req.user.id,
    items: shipmentItems,
    provider: process.env.SHIPPING_PROVIDER || 'manual',
    awbNumber: result.awbNumber,
    courierName: result.courierName,
    courierId: result.shipmentId,
    trackingUrl: result.trackingUrl,
    status: result.status || 'pending',
    weight,
    dimensions,
    declaredValue,
    isCod,
    shippingCharge: result.shippingCharge || 0,
    pickup,
    _manual: result._manual,
  });

  if (result._manual) {
    order.items = order.items.map(item => {
      if (shipmentItems.includes(item._id)) {
        item.deliveryStatus = 'shipped';
      }
      return item;
    });
    if (order.items.every(i => i.deliveryStatus === 'shipped' || i.deliveryStatus === 'delivered')) {
      order.status = 'shipped';
    }
    await order.save();
  }

  res.status(201).json(ApiResponse.success(shipment, 'Shipment created'));
});

exports.getShipments = asyncHandler(async (req, res) => {
  const filter = { seller: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.orderId) filter.order = req.query.orderId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const [shipments, total] = await Promise.all([
    Shipment.find(filter).populate('order', 'orderNumber status total').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Shipment.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({ shipments, total, page, pages: Math.ceil(total / limit) }, 'Shipments fetched'));
});

exports.getShipmentById = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ _id: req.params.id }).populate('order');
  if (!shipment) throw ApiError.notFound('Shipment not found');
  res.json(ApiResponse.success(shipment, 'Shipment fetched'));
});

exports.trackShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ _id: req.params.id });
  if (!shipment) throw ApiError.notFound('Shipment not found');
  if (!shipment.awbNumber) throw ApiError.badRequest('No AWB number');

  const provider = getShippingProvider();
  const tracking = await provider.trackShipment(shipment.awbNumber);

  if (tracking.events?.length) {
    shipment.trackingEvents = tracking.events.map(e => ({
      status: e.status,
      location: e.location,
      description: e.description,
      timestamp: e.timestamp,
    }));
    const lastEvent = tracking.events[tracking.events.length - 1];
    if (lastEvent?.status === 'delivered') {
      shipment.status = 'delivered';
      shipment.deliveredAt = new Date(lastEvent.timestamp);
    } else if (['in_transit', 'out_for_delivery'].includes(lastEvent?.status)) {
      shipment.status = lastEvent.status;
    }
    await shipment.save();
  }

  res.json(ApiResponse.success({ shipment, tracking }, 'Tracking fetched'));
});

exports.updateTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, location, description } = req.body;
  const shipment = await Shipment.findOne({ _id: id, seller: req.user.id });
  if (!shipment) throw ApiError.notFound('Shipment not found');

  shipment.trackingEvents.push({ status, location, description, timestamp: new Date() });
  shipment.status = status || shipment.status;
  if (status === 'delivered') shipment.deliveredAt = new Date();

  if (status === 'delivered' || status === 'shipped') {
    const Order = require('../models/Order');
    const order = await Order.findById(shipment.order);
    if (order) {
      order.items = order.items.map(item => {
        if (shipment.items.includes(item._id)) {
          item.deliveryStatus = status === 'delivered' ? 'delivered' : 'shipped';
        }
        return item;
      });
      if (order.items.every(i => i.deliveryStatus === 'shipped' || i.deliveryStatus === 'delivered')) {
        order.status = status === 'delivered' ? 'delivered' : 'shipped';
      }
      await order.save();
    }
  }

  await shipment.save();
  res.json(ApiResponse.success(shipment, 'Tracking updated'));
});

exports.getLabel = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ _id: req.params.id, seller: req.user.id });
  if (!shipment) throw ApiError.notFound('Shipment not found');

  if (shipment.label?.url) {
    return res.json(ApiResponse.success(shipment.label, 'Label fetched'));
  }

  const provider = getShippingProvider();
  if (shipment.courierId && !shipment._manual) {
    const result = await provider.generateLabel(shipment.courierId);
    if (result.url) {
      shipment.label = { url: result.url, generatedAt: new Date() };
      await shipment.save();
      return res.json(ApiResponse.success(shipment.label, 'Label generated'));
    }
  }

  throw ApiError.badRequest('Label not available. Use manual shipping or configure Shiprocket.');
});

exports.cancelShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ _id: req.params.id, seller: req.user.id });
  if (!shipment) throw ApiError.notFound('Shipment not found');
  if (['delivered', 'returned'].includes(shipment.status)) throw ApiError.badRequest('Cannot cancel delivered/returned shipment');

  const provider = getShippingProvider();
  if (shipment.courierId && !shipment._manual) {
    await provider.cancelShipment(shipment.courierId);
  }

  shipment.status = 'cancelled';
  await shipment.save();
  res.json(ApiResponse.success(shipment, 'Shipment cancelled'));
});
