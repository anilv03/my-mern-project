const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getIO } = require('../config/socket');

exports.getOrCreateChat = asyncHandler(async (req, res) => {
  const { sellerId, productId, orderId } = req.body;
  const product = await Product.findById(productId).select('seller');
  const seller = product ? product.seller.toString() : sellerId;
  if (req.user.id === seller) throw ApiError.badRequest('Cannot chat with yourself');
  const chat = await Chat.findOrCreate(req.user.id, seller, productId, orderId);
  await chat.populate([{ path: 'participants', select: 'name avatar email' }, { path: 'lastMessage' }]);
  res.json(ApiResponse.success(chat, 'Chat created'));
});

exports.getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'name avatar email role')
    .populate('lastMessage')
    .populate('product', 'title slug thumbnail pricing')
    .sort({ lastMessageAt: -1, updatedAt: -1 });
  res.json(ApiResponse.success(chats, 'Chats fetched'));
});

exports.getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, participants: req.user.id })
    .populate('participants', 'name avatar email role')
    .populate('product', 'title slug thumbnail pricing')
    .populate('lastMessage');
  if (!chat) throw ApiError.notFound('Chat not found');
  res.json(ApiResponse.success(chat, 'Chat fetched'));
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chat = await Chat.findOne({ _id: id, participants: req.user.id });
  if (!chat) throw ApiError.notFound('Chat not found');
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const messages = await Message.find({ chat: id, deletedFor: { $ne: req.user.id } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name avatar');
  const total = await Message.countDocuments({ chat: id, deletedFor: { $ne: req.user.id } });
  res.json(ApiResponse.success({ messages: messages.reverse(), total, page, pages: Math.ceil(total / limit) }, 'Messages fetched'));
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, messageType, attachments, metadata } = req.body;
  const chat = await Chat.findOne({ _id: id, participants: req.user.id });
  if (!chat) throw ApiError.notFound('Chat not found');

  const message = await Message.create({
    chat: id,
    sender: req.user.id,
    content,
    messageType: messageType || 'text',
    attachments: attachments || [],
    metadata,
  });

  chat.lastMessage = message._id;
  chat.lastMessageAt = new Date();
  const otherParticipant = chat.participants.find(p => p.toString() !== req.user.id);
  chat.unreadCount.set(otherParticipant.toString(), (chat.unreadCount.get(otherParticipant.toString()) || 0) + 1);
  await chat.save();

  const populated = await message.populate('sender', 'name avatar');
  const io = getIO();
  chat.participants.forEach(pid => {
    io.to(`user:${pid}`).emit('chat:message', populated.toObject());
  });
  io.to(`user:${otherParticipant}`).emit('chat:unread', { chatId: id, count: chat.unreadCount.get(otherParticipant.toString()) });

  res.status(201).json(ApiResponse.success(populated, 'Message sent'));
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chat = await Chat.findOne({ _id: id, participants: req.user.id });
  if (!chat) throw ApiError.notFound('Chat not found');

  await Message.updateMany({ chat: id, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
    { $addToSet: { readBy: req.user.id }, $set: { readAt: new Date() } });

  chat.unreadCount.set(req.user.id.toString(), 0);
  await chat.save();

  res.json(ApiResponse.success(null, 'Messages marked as read'));
});

exports.deleteForMe = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;
  await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: req.user.id } });
  res.json(ApiResponse.success(null, 'Message deleted'));
});
