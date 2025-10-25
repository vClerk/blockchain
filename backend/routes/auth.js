const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { ethers } = require('ethers');
const { generateToken, verifyToken, verifyWalletSignature } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validator');

// Login with wallet signature
router.post('/login', [
  validators.ethereumAddress('address'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('role').isIn(['farmer', 'government']).withMessage('Invalid role'),
  handleValidationErrors,
  verifyWalletSignature
], async (req, res) => {
  try {
    const { address, role } = req.body;
    
    // Generate JWT token with 24h expiry
    const token = generateToken({
      address: address.toLowerCase(),
      role: role,
      loginTime: Date.now()
    }, '24h');
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          address: address.toLowerCase(),
          role: role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get current user (requires valid JWT)
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// Logout (client should delete token, this endpoint is for logging purposes)
router.post('/logout', verifyToken, (req, res) => {
  // Log logout event
  console.log(`User ${req.user.address} logged out at ${new Date().toISOString()}`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token
router.post('/refresh', verifyToken, (req, res) => {
  try {
    // Generate new token with same payload but fresh expiry
    const newToken = generateToken({
      address: req.user.address,
      role: req.user.role,
      loginTime: Date.now()
    }, '24h');
    
    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

module.exports = router;
