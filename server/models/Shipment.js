const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: String,
  description: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order.items' }],
  provider: { type: String, enum: ['shiprocket', 'delhivery', 'bluedart', 'fedex', 'indiapost', 'manual'], required: true },
  awbNumber: { type: String, unique: true, sparse: true },
  courierName: String,
  courierId: String,
  shipmentId: String,
  trackingUrl: String,
  status: { type: String, enum: ['pending', 'pickup_scheduled', 'pickup_done', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled', 'failed'], default: 'pending' },
  trackingEvents: [trackingEventSchema],
  pickup: {
    scheduledDate: Date,
    address: String,
    pincode: String,
    instructions: String,
  },
  weight: { value: Number, unit: { type: String, default: 'kg' } },
  dimensions: { length: Number, width: Number, height: Number, unit: { type: String, default: 'cm' } },
  declaredValue: Number,
  shippingCharge: Number,
  isCod: { type: Boolean, default: false },
  label: { url: String, generatedAt: Date },
  manifest: { url: String, generatedAt: Date },
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
}, { timestamps: true });

shipmentSchema.index({ order: 1 });
shipmentSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
