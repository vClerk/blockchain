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
  handleValidationErrors
};
