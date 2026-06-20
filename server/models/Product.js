const mongoose = require('mongoose');
const { PRODUCT_TYPES_ARRAY, DELIVERY_TYPES, PRODUCT_STATUS } = require('../constants/productTypes');

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    productType: {
      type: String,
      enum: PRODUCT_TYPES_ARRAY,
      required: [true, 'Product type is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    deliveryType: {
      type: String,
      enum: Object.values(DELIVERY_TYPES),
      default: DELIVERY_TYPES.INSTANT_DOWNLOAD,
    },
    downloadAllowed: {
      type: Boolean,
      default: true,
    },
    streamOnly: {
      type: Boolean,
      default: false,
    },
    trackable: {
      type: Boolean,
      default: false,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    tags: [String],
    images: [
      {
        public_id: String,
        url: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    videos: [
      {
        public_id: String,
        url: String,
        thumbnail: String,
      },
    ],
    pricing: {
      originalPrice: { type: Number, required: true, min: 0 },
      sellingPrice: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0 },
      discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      taxRate: { type: Number, default: 0 },
      priceHistory: [
        {
          price: Number,
          effectiveDate: { type: Date, default: Date.now },
        },
      ],
    },
    inventory: {
      quantity: { type: Number, default: 0 },
      reservedQuantity: { type: Number, default: 0 },
      lowStockThreshold: { type: Number, default: 5 },
      trackInventory: { type: Boolean, default: true },
      allowBackorder: { type: Boolean, default: false },
    },
    digitalFile: {
      fileType: { type: String, enum: ['pdf', 'epub', 'mp3', 'mp4', 'zip', 'exe', 'other'] },
      fileSize: Number,
      fileUrl: String,
      publicId: String,
      author: String,
      isbn: String,
      publisher: String,
      language: { type: String, default: 'English' },
      pages: Number,
      duration: Number,
      fileCount: Number,
      sampleUrl: String,
      isDownloadable: { type: Boolean, default: true },
      downloadLimit: { type: Number, default: 0 },
      systemRequirements: String,
      supportedFormats: [String],
      version: String,
      releaseDate: Date,
      courseVideos: [
        {
          title: String,
          url: String,
          publicId: String,
          fileName: String,
          fileSize: Number,
          duration: Number,
          order: Number,
          thumbnail: String,
        },
      ],
    },
    physicalDetails: {
      isbn: String,
      isbn13: String,
      publisher: String,
      publicationYear: Number,
      language: { type: String, default: 'English' },
      pageCount: Number,
      format: { type: String, enum: ['paperback', 'hardcover', 'spiral', 'other'] },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, default: 'cm' },
      },
      weight: { type: Number, unit: { type: String, default: 'g' } },
      edition: String,
      condition: {
        type: String,
        enum: ['new', 'like_new', 'very_good', 'good', 'acceptable', 'poor'],
      },
      conditionNotes: String,
    },
    bundleContent: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: { type: Number, default: 1 },
        savings: Number,
      },
    ],
    variants: [
      {
        type: { type: String, enum: ['format', 'edition', 'language', 'region', 'bundle'] },
        name: String,
        sku: String,
        price: Number,
        stock: Number,
        isActive: { type: Boolean, default: true },
      },
    ],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    sales: {
      count: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
    settings: {
      isFeatured: { type: Boolean, default: false },
      isNewArrival: { type: Boolean, default: false },
      isBestSeller: { type: Boolean, default: false },
      isBundle: { type: Boolean, default: false },
      isSubscription: { type: Boolean, default: false },
      requiresShipping: { type: Boolean, default: false },
      isDownloadable: { type: Boolean, default: false },
      hasSample: { type: Boolean, default: false },
      isbnRequired: { type: Boolean, default: false },
      ageRestriction: { type: Number, default: 0 },
      previewAvailable: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.DRAFT,
    },
    rejectionReason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    publishedAt: Date,
    viewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

productSchema.virtual('orderItems', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'product',
});

productSchema.index({ status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ 'sales.count': -1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'settings.isFeatured': 1, 'settings.isNewArrival': 1, 'settings.isBestSeller': 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
