// SECURITY CONFIGURATION AND BEST PRACTICES
// This file contains security utilities and configurations

const crypto = require('crypto');

/**
 * Security Configuration Object
 */
const securityConfig = {
  // JWT Configuration
  jwt: {
    minSecretLength: 32,
    algorithm: 'HS256',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },

  // Rate Limiting Configuration
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // Only 5 failed attempts
    },
    blockchain: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50
    },
    strict: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20
    }
  },

  // Request Body Limits
  bodyLimits: {
    json: '10kb',
    urlencoded: '10kb',
    raw: '10kb'
  },

  // Password/Key Requirements
  keyRequirements: {
    minLength: 32,
    requireUppercase: false, // Hex strings may not have uppercase
    requireLowercase: false,
    requireNumbers: true,
    requireSpecialChars: false
  },

  // Session Configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },

  // CORS Configuration
  cors: {
    maxAge: 86400, // 24 hours
    credentials: true
  },

  // CSP Configuration
  csp: {
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

  // Sensitive field patterns (for log sanitization)
  sensitiveFields: [
    'password',
    'privateKey',
    'private_key',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'creditCard',
    'ssn',
    'pin'
  ],

  // Dangerous patterns (for XSS/injection prevention)
  dangerousPatterns: [
    '<script',
    'javascript:',
    'onerror=',
    'onload=',
    'eval(',
    'innerHTML',
    'document.cookie',
    '$where',
    '$regex',
    'DROP TABLE',
    'DELETE FROM',
    'INSERT INTO',
    '--',
    ';--'
  ]
};

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Sanitize log data by removing sensitive fields
 */
function sanitizeLogData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = securityConfig.sensitiveFields.some(
      field => keyLower.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if string contains dangerous patterns
 */
function containsDangerousPatterns(input) {
  if (typeof input !== 'string') return false;
  
  const inputLower = input.toLowerCase();
  return securityConfig.dangerousPatterns.some(
    pattern => inputLower.includes(pattern.toLowerCase())
  );
}

/**
 * Validate JWT secret strength
 */
function validateJWTSecret(secret) {
  if (!secret) {
    return {
      valid: false,
      error: 'JWT secret is required'
    };
  }

  if (secret.length < securityConfig.jwt.minSecretLength) {
    return {
      valid: false,
      error: `JWT secret must be at least ${securityConfig.jwt.minSecretLength} characters`
    };
  }

  // Check for common weak secrets
  const weakSecrets = [
    'secret',
    'password',
    '123456',
    'admin',
    'test',
    'default',
    'changeme',
    'your_jwt_secret_key_here',
    'fallback-secret-CHANGE-IN-PRODUCTION'
  ];

  if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
    return {
      valid: false,
      error: 'JWT secret is too weak or common'
    };
  }

  return { valid: true };
}

/**
 * Hash sensitive data for storage (one-way)
 */
function hashSensitiveData(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Encrypt data with AES-256-GCM
 */
function encryptData(data, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
function decryptData(encryptedData, encryptionKey, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

/**
 * Create audit log entry
 */
function createAuditLog(action, user, details) {
  return {
    timestamp: new Date().toISOString(),
    action,
    user: user || 'anonymous',
    details: sanitizeLogData(details),
    ip: details?.ip || 'unknown'
  };
}

/**
 * Validate Ethereum address format
 */
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash format
 */
function isValidTransactionHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Security middleware to add security headers
 */
function securityHeadersMiddleware(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Request logging middleware with sanitization
 */
function secureLoggerMiddleware(req, res, next) {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    body: sanitizeLogData(req.body),
    query: sanitizeLogData(req.query)
  };

  console.log('📝 Request:', logData);
  next();
}

module.exports = {
  securityConfig,
  generateSecureToken,
  sanitizeLogData,
  containsDangerousPatterns,
  validateJWTSecret,
  hashSensitiveData,
  encryptData,
  decryptData,
  createAuditLog,
  isValidEthereumAddress,
  isValidTransactionHash,
  securityHeadersMiddleware,
  secureLoggerMiddleware
};
