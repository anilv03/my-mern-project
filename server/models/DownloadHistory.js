const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    ipAddress: String,
    userAgent: String,
    downloadCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

downloadHistorySchema.index({ user: 1, product: 1 });
downloadHistorySchema.index({ product: 1, createdAt: -1 });
downloadHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);
