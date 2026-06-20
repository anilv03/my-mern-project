const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: Date,
  source: { type: String, enum: ['homepage', 'checkout', 'footer', 'admin', 'other'], default: 'homepage' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

newsletterSchema.index({ isActive: 1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);
