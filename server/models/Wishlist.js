const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  notifyOnPriceDrop: {
    type: Boolean,
    default: false,
  },
  notifyOnRestock: {
    type: Boolean,
    default: false,
  },
});

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareLink: String,
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
