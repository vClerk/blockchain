// Load environment variables FIRST before any other modules
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const blockchainRoutes = require('./routes/blockchain');
const farmerRoutes = require('./routes/farmers');
const schemeRoutes = require('./routes/schemes');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// Log important env vars for debugging
console.log('🔍 Environment check:');
console.log('  - CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS ? '✅ Set' : '❌ Missing');
console.log('  - BLOCKCHAIN_NETWORK:', process.env.BLOCKCHAIN_NETWORK ? '✅ Set' : '❌ Missing');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

// Rate limiting - More lenient limits for development, stricter for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 1000, // Very high limit for development
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Stricter rate limiting for write operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500, // Higher limit for development
  message: 'Too many write operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// SECURITY: Additional rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // More attempts allowed in dev
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// SECURITY: Rate limiting for blockchain operations (most expensive)
const blockchainOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // Higher limit for development
  message: 'Blockchain operation limit reached. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Security: Configure Helmet with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://alfajores-forno.celo-testnet.org"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Security: Configure CORS properly with stricter rules
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    // SECURITY: Only allow no-origin in development
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Origin header required'));
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight for 24 hours
}));

app.use(morgan('combined'));
app.use(limiter);

// Security: Limit request body size to prevent DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes with appropriate rate limiting
app.use('/api/blockchain', blockchainOpLimiter, blockchainRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/payments', strictLimiter, paymentRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware - Enhanced security
app.use((err, req, res, next) => {
  // Log error details server-side only
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Never expose internal details in production
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An error occurred. Please try again later.'
  };
  
  // Add error ID for tracking (but no sensitive details)
  if (process.env.NODE_ENV === 'production') {
    response.errorId = Date.now().toString(36);
  }
  
  res.status(statusCode).json(response);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
