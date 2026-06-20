const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.set('etag', false);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://picsum.photos", "https://images.unsplash.com", "blob:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(hpp());

const morganStream = { write: (msg) => logger.info(msg.trimEnd()) };
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined', { stream: morganStream }));

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});
app.use('/api/v1/auth/login', authLimiter);

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many refresh attempts, please try again later' },
});
app.use('/api/v1/auth/refresh-token', refreshLimiter);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' },
});
app.use('/api/v1/auth/register', strictLimiter);
app.use('/api/v1/auth/send-email-otp', strictLimiter);
app.use('/api/v1/auth/send-phone-otp', strictLimiter);
app.use('/api/v1/auth/forgot-password', strictLimiter);
app.use('/api/v1/auth/seller/register', strictLimiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zalnio API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/orders', require('./routes/order.routes'));
app.use('/api/v1/reviews', require('./routes/review.routes'));
app.use('/api/v1/payments', require('./routes/payment.routes'));
app.use('/api/v1/seller', require('./routes/seller.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/subscriptions', require('./routes/subscription.routes'));
app.use('/api/v1/coupons', require('./routes/coupon.routes'));
app.use('/api/v1/wishlist', require('./routes/wishlist.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/upload', require('./routes/upload.routes'));
app.use('/api/v1/access', require('./routes/access.routes'));
app.use('/api/v1/content', require('./routes/content.routes'));

// Financial & Earning Modules
app.use('/api/v1/wallet', require('./routes/wallet.routes'));
app.use('/api/v1/cashback', require('./routes/cashback.routes'));
app.use('/api/v1/referral', require('./routes/referral.routes'));
app.use('/api/v1/creator-rewards', require('./routes/creatorReward.routes'));
app.use('/api/v1/earnings', require('./routes/earning.routes'));

// Flash Sales
app.use('/api/v1/flash-sales', require('./routes/flashSale.routes'));
// Blog / CMS
app.use('/api/v1/blogs', require('./routes/blog.routes'));
// Newsletter
app.use('/api/v1/newsletter', require('./routes/newsletter.routes'));

// Payouts / Settlements
app.use('/api/v1/payouts', require('./routes/payout.routes'));
// Refunds
app.use('/api/v1/refunds', require('./routes/refund.routes'));
// Chat (Real-time Messaging)
app.use('/api/v1/chats', require('./routes/chat.routes'));
// Shipping
app.use('/api/v1/shipping', require('./routes/shipping.routes'));
// Reports
app.use('/api/v1/reports', require('./routes/report.routes'));

// Public (homepage data, stats, etc.)
app.use('/api/v1/public', require('./routes/public.routes'));

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    app.get('*', (req, res, next) => {
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/') && !req.path.startsWith('/socket.io/')) {
        res.sendFile(path.join(publicPath, 'index.html'));
      } else {
        next(ApiError.notFound(`Route ${req.originalUrl} not found`));
      }
    });
  } else {
    app.all('*', (req, res, next) => {
      next(ApiError.notFound(`Route ${req.originalUrl} not found`));
    });
  }
} else {
  app.all('*', (req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
  });
}

app.use(errorHandler);

module.exports = app;
