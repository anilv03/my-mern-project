const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/generateToken');

let io;

const configureSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (socket.handshake.query.role === 'seller') {
      socket.join('sellers');
    }
    if (socket.handshake.query.role === 'admin' || socket.handshake.query.role === 'superadmin') {
      socket.join('admins');
    }

    socket.on('chat:typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('chat:typing', { chatId, userId });
    });

    socket.on('chat:stop_typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('chat:stop_typing', { chatId, userId });
    });

    socket.on('chat:join', ({ chatId }) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { configureSocket, getIO };
