const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema(
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
    completedVideos: [
      {
        videoIndex: { type: Number, required: true },
        completedAt: { type: Date, default: Date.now },
        duration: Number,
        watchedSeconds: Number,
      },
    ],
    lastVideoIndex: {
      type: Number,
      default: 0,
    },
    lastPosition: {
      type: Number,
      default: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    completedVideosCount: {
      type: Number,
      default: 0,
    },
    progressPercent: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

courseProgressSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
