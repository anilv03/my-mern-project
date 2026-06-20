const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['format', 'edition', 'language', 'binding', 'color', 'size', 'region', 'license'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    digitalFile: {
      public_id: String,
      url: String,
      fileSize: Number,
      fileType: String,
    },
    metadata: {
      isbn: String,
      pageCount: Number,
      duration: Number,
      language: String,
      region: String,
      licenseType: String,
      activationCode: String,
    },
    sales: {
      count: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

productVariantSchema.index({ product: 1, type: 1 });
productVariantSchema.index({ sku: 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
