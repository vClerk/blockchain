#!/usr/bin/env node

/**
 * Security Setup Script
 * Generates secure secrets and validates environment configuration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (!fs.existsSync(envPath)) {
    log('⚠️  .env file not found!', 'yellow');
    
    if (fs.existsSync(envExamplePath)) {
      log('📄 Creating .env from .env.example...', 'cyan');
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ .env file created', 'green');
      return true;
    } else {
      log('❌ .env.example not found. Cannot create .env file.', 'red');
      return false;
    }
  }

  return true;
}

function validateJWTSecret(secret) {
  if (!secret || secret.length < 32) {
    return false;
  }

  const weakSecrets = [
    'secret',
    'password',
    '123456',
    'admin',
    'test',
    'changeme',
    'your_jwt_secret_key_here',
    'fallback-secret-change-in-production',
    'change_this'
  ];

  return !weakSecrets.some(weak => secret.toLowerCase().includes(weak));
}

function updateEnvFile(updates) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add each key-value pair
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

function checkGitignore() {
  const gitignorePath = path.join(__dirname, '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    log('⚠️  .gitignore not found', 'yellow');
    return;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  if (!gitignoreContent.includes('.env')) {
    log('⚠️  .env is not in .gitignore!', 'yellow');
    log('⚠️  Your secrets could be exposed if committed to git!', 'red');
    log('📝 Adding .env to .gitignore...', 'cyan');
    
    fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.local\n.env.*.local\n');
    log('✅ .env added to .gitignore', 'green');
  }
}

function runSecuritySetup() {
  log('\n🔒 Smart Subsidy Security Setup\n', 'bright');
  log('=================================\n', 'cyan');

  // Check and create .env file if needed
  if (!checkEnvFile()) {
    log('\n❌ Setup failed: Cannot proceed without .env file\n', 'red');
    process.exit(1);
  }

  // Load current environment
  require('dotenv').config();

  // Check JWT_SECRET
  log('🔍 Checking JWT_SECRET...', 'cyan');
  const currentJWT = process.env.JWT_SECRET;
  
  if (!validateJWTSecret(currentJWT)) {
    log('❌ JWT_SECRET is missing or weak!', 'red');
    log('🔐 Generating new secure JWT_SECRET...', 'cyan');
    
    const newJWT = generateSecureSecret(64);
    updateEnvFile({ JWT_SECRET: newJWT });
    
    log('✅ New JWT_SECRET generated and saved', 'green');
    log(`   Length: ${newJWT.length} characters`, 'cyan');
  } else {
    log('✅ JWT_SECRET is properly configured', 'green');
  }

  // Check SESSION_SECRET
  log('\n🔍 Checking SESSION_SECRET...', 'cyan');
  const currentSession = process.env.SESSION_SECRET;
  
  if (!validateJWTSecret(currentSession)) {
    log('❌ SESSION_SECRET is missing or weak!', 'red');
    log('🔐 Generating new secure SESSION_SECRET...', 'cyan');
    
    const newSession = generateSecureSecret(64);
    updateEnvFile({ SESSION_SECRET: newSession });
    
    log('✅ New SESSION_SECRET generated and saved', 'green');
    log(`   Length: ${newSession.length} characters`, 'cyan');
  } else {
    log('✅ SESSION_SECRET is properly configured', 'green');
  }

  // Check .gitignore
  log('\n🔍 Checking .gitignore...', 'cyan');
  checkGitignore();

  // Security recommendations
  log('\n📋 Security Recommendations:\n', 'bright');
  log('  ✓ Use different secrets for dev/staging/production', 'cyan');
  log('  ✓ Never commit .env files to version control', 'cyan');
  log('  ✓ Rotate secrets every 90 days', 'cyan');
  log('  ✓ Use HTTPS in production', 'cyan');
  log('  ✓ Enable rate limiting', 'cyan');
  log('  ✓ Implement client-side transaction signing', 'cyan');
  log('  ✓ Regular security audits', 'cyan');

  // Check for private key
  log('\n🔍 Checking PRIVATE_KEY configuration...', 'cyan');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey || privateKey === 'YOUR_PRIVATE_KEY_HERE') {
    log('⚠️  PRIVATE_KEY not configured', 'yellow');
    log('⚠️  Government operations will not work without it', 'yellow');
    log('📝 Add your private key to .env file:', 'cyan');
    log('   PRIVATE_KEY=0x...', 'cyan');
    log('\n⚠️  NEVER commit your real private key!', 'red');
  } else {
    log('✅ PRIVATE_KEY is configured', 'green');
    log('⚠️  Ensure it\'s never committed to git!', 'yellow');
  }

  // Final summary
  log('\n=================================', 'cyan');
  log('🎉 Security setup complete!\n', 'green');
  log('Next steps:', 'bright');
  log('  1. Review your .env file', 'cyan');
  log('  2. Add your PRIVATE_KEY if needed', 'cyan');
  log('  3. Run: npm start', 'cyan');
  log('  4. Read SECURITY_IMPLEMENTATION_GUIDE.md', 'cyan');
  log('\n⚠️  Remember: Never share or commit your .env file!\n', 'yellow');
}

// Run the setup
if (require.main === module) {
  runSecuritySetup();
}

module.exports = {
  generateSecureSecret,
  validateJWTSecret,
  updateEnvFile
};
