const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

// SECURITY: Enforce strong JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET on startup
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ SECURITY ERROR: JWT_SECRET must be set in .env and be at least 32 characters long');
  console.error('⚠️  Using a weak JWT secret is a critical security vulnerability!');
  console.error('📝  Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  
  // In development, generate a random secret and warn
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  DEVELOPMENT MODE: Using temporary random JWT secret');
    // Store in memory only - will change on restart
    process.env.JWT_SECRET_TEMP = crypto.randomBytes(64).toString('hex');
  } else {
    // In production, refuse to start
    console.error('🛑 CRITICAL: Cannot start server without proper JWT_SECRET in production');
    process.exit(1);
  }
}

const ACTIVE_JWT_SECRET = JWT_SECRET || process.env.JWT_SECRET_TEMP;

// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, ACTIVE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Security: Don't expose detailed error information
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Middleware to verify wallet signature
const verifyWalletSignature = async (req, res, next) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Address, signature, and message are required'
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check if message is not too old (prevent replay attacks)
    const messageData = JSON.parse(message);
    const messageTimestamp = new Date(messageData.timestamp).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - messageTimestamp > fiveMinutes) {
      return res.status(401).json({
        success: false,
        error: 'Message has expired'
      });
    }

    req.walletAddress = address;
    next();
  } catch (error) {
    // Security: Don't expose detailed error information
    console.error('Signature verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Signature verification failed'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Generate JWT token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, ACTIVE_JWT_SECRET, { expiresIn });
};

// Security: Sanitize sensitive data from logs
const sanitizeForLog = (data) => {
  const sensitive = ['privateKey', 'password', 'secret', 'token'];
  const sanitized = { ...data };
  sensitive.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  });
  return sanitized;
};

// Security: Validate request origin
const validateOrigin = (req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyWalletSignature,
  requireRole,
  generateToken,
  sanitizeForLog,
  validateOrigin
};
