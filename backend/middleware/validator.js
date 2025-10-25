const { body, param, validationResult } = require('express-validator');
const { ethers } = require('ethers');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const validators = {
  // Ethereum address validation
  ethereumAddress: (field) => 
    body(field)
      .trim()
      .custom((value) => {
        if (!ethers.isAddress(value)) {
          throw new Error('Invalid Ethereum address');
        }
        return true;
      }),

  // String validation with sanitization
  safeString: (field, minLength = 1, maxLength = 255) =>
    body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
      .escape(), // Prevent XSS

  // Number validation
  positiveNumber: (field) =>
    body(field)
      .isNumeric()
      .withMessage(`${field} must be a number`)
      .custom((value) => {
        if (parseFloat(value) <= 0) {
          throw new Error(`${field} must be positive`);
        }
        return true;
      }),

  // Integer validation
  positiveInteger: (field) =>
    body(field)
      .isInt({ min: 1 })
      .withMessage(`${field} must be a positive integer`),

  // Timestamp validation
  futureTimestamp: (field) =>
    body(field)
      .isNumeric()
      .custom((value) => {
        const timestamp = parseInt(value);
        if (timestamp <= Date.now() / 1000) {
          throw new Error(`${field} must be in the future`);
        }
        return true;
      }),

  // JWT token validation
  jwtToken: (field) =>
    body(field)
      .trim()
      .matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .withMessage('Invalid token format'),

  // Enum validation
  enum: (field, allowedValues) =>
    body(field)
      .isIn(allowedValues)
      .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`)
};

// SECURITY: Additional protection utilities
const securityValidators = {
  // Prevent NoSQL injection in JSON fields
  noSQLInjection: (field) =>
    body(field)
      .custom((value) => {
        if (typeof value === 'string') {
          const forbidden = ['$', '{', '}', '<', '>', 'script', 'javascript:'];
          if (forbidden.some(pattern => value.toLowerCase().includes(pattern))) {
            throw new Error('Invalid characters detected');
          }
        }
        return true;
      }),

  // Sanitize file names
  safeFileName: (field) =>
    body(field)
      .trim()
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Invalid file name format')
      .isLength({ max: 255 }),

  // URL validation
  safeURL: (field) =>
    body(field)
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Invalid URL format'),

  // Hex string validation (for hashes)
  hexString: (field, length) =>
    body(field)
      .trim()
      .matches(/^0x[a-fA-F0-9]+$/)
      .withMessage('Invalid hex string')
      .custom((value) => {
        if (length && value.length !== length + 2) { // +2 for '0x' prefix
          throw new Error(`Hex string must be ${length} characters (excluding 0x prefix)`);
        }
        return true;
      }),

  // IP address validation
  ipAddress: (field) =>
    body(field)
      .isIP()
      .withMessage('Invalid IP address'),

  // Rate limit check
  rateLimitCheck: (maxRequests, windowMs) => {
    const requests = new Map();
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key).filter(time => time > windowStart);
      
      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        });
      }
      
      userRequests.push(now);
      requests.set(key, userRequests);
      next();
    };
  },

  // Content Security Policy violation detector
  detectCSPViolation: (field) =>
    body(field)
      .custom((value) => {
        const dangerous = [
          '<script', 'javascript:', 'onerror=', 'onload=',
          'eval(', 'innerHTML', 'document.cookie'
        ];
        const valueStr = String(value).toLowerCase();
        if (dangerous.some(pattern => valueStr.includes(pattern))) {
          throw new Error('Potential XSS detected');
        }
        return true;
      })
};

// Pre-defined validation chains
const validationChains = {
  registerFarmer: [
    validators.safeString('name', 2, 100),
    validators.safeString('location', 2, 200),
    validators.safeString('cropType', 2, 50),
    validators.positiveNumber('farmSize')
  ],

  createScheme: [
    validators.safeString('name', 3, 200),
    validators.safeString('description', 10, 1000),
    validators.positiveNumber('amount'),
    validators.positiveInteger('maxBeneficiaries'),
    validators.futureTimestamp('expiryDate')
  ],

  verifyFarmer: [
    validators.ethereumAddress('farmerAddress')
  ],

  processPayment: [
    validators.ethereumAddress('farmerAddress'),
    validators.positiveInteger('schemeId'),
    validators.positiveNumber('amount')
  ]
};

module.exports = {
  validators,
  validationChains,
  handleValidationErrors,
  securityValidators
};
