const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-CHANGE-IN-PRODUCTION';

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
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
  verifyToken,
  verifyWalletSignature,
  requireRole,
  generateToken
};
