const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: Date,
  unreadCount: { type: Map, of: Number, default: {} },
}, { timestamps: true });

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

chatSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }
  this.participants.sort();
  next();
});

chatSchema.statics.findOrCreate = async function (buyerId, sellerId, productId = null, orderId = null) {
  const participants = [buyerId, sellerId].sort();
  let chat = await this.findOne({ participants: { $all: participants, $size: 2 } });
  if (!chat) {
    chat = await this.create({ participants, product: productId, order: orderId });
  }
  return chat;
};

module.exports = mongoose.model('Chat', chatSchema);
