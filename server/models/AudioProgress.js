const mongoose = require('mongoose');

const audioProgressSchema = new mongoose.Schema(
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
    currentPosition: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    playbackSpeed: {
      type: Number,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    lastListened: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

audioProgressSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('AudioProgress', audioProgressSchema);
