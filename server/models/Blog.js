const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, trim: true },
  content: { type: String, required: true },
  coverImage: { url: String, public_id: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  publishedAt: Date,
  viewCount: { type: Number, default: 0 },
  readTimeMinutes: { type: Number },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    comment: String,
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

blogSchema.index({ slug: 1, isPublished: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isFeatured: 1 });
blogSchema.index({ author: 1 });

module.exports = mongoose.model('Blog', blogSchema);
