require('dotenv').config();
const { configureCloudinary } = require('./config/cloudinary');
configureCloudinary();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { configureSocket } = require('./config/socket');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

configureSocket(server);

const seedRoles = async () => {
  const Role = require('./models/Role');
  const count = await Role.countDocuments();
  if (count > 0) return;
  const defaults = [
    { name: 'super_admin', description: 'Full access to all features', permissions: [], isSystem: true },
    { name: 'admin', description: 'Administrator with most permissions', permissions: [], isSystem: true },
    { name: 'seller', description: 'Seller account', permissions: [], isSystem: true },
    { name: 'customer', description: 'Regular customer', permissions: [], isSystem: true },
  ];
  await Role.insertMany(defaults);
  logger.info('Default roles seeded');
};

const startServer = async () => {
  try {
    await connectDB();
    await seedRoles();
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutDown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000).unref();
};

process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
});

startServer();

module.exports = server;
