const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 5000 },
  messageType: { type: String, enum: ['text', 'image', 'file', 'order', 'system'], default: 'text' },
  attachments: [{
    url: String,
    type: { type: String, enum: ['image', 'file'] },
    name: String,
    size: Number,
  }],
  metadata: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    action: String,
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readAt: Date,
  editedAt: Date,
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
