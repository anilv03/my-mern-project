const mongoose = require('mongoose');

const flashSaleProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  salePrice: { type: Number, required: true },
  discountPercent: { type: Number, required: true },
  quantity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  maxPerUser: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
});

const flashSaleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  banner: { url: String, public_id: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  products: [flashSaleProductSchema],
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

flashSaleSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
flashSaleSchema.index({ isFeatured: 1 });

flashSaleSchema.virtual('isRunning').get(function () {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
});

module.exports = mongoose.model('FlashSale', flashSaleSchema);
