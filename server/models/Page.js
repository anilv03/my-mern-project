const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, default: '' },
    excerpt: { type: String, trim: true },
    coverImage: { url: String, public_id: String },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,
    viewCount: { type: Number, default: 0 },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
  },
  { timestamps: true }
);

pageSchema.index({ status: 1 });

module.exports = mongoose.model('Page', pageSchema);
