const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

const router = express.Router();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL = 'http://localhost:3000',
  JWT_SECRET
} = process.env;

// SECURITY: Validate JWT_SECRET exists
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ SECURITY ERROR: JWT_SECRET must be set in .env and be at least 32 characters long');
  console.error('⚠️  OAuth routes will be disabled for security');
}

// Only configure Google OAuth if credentials are provided AND JWT_SECRET is secure
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && JWT_SECRET && JWT_SECRET.length >= 32) {
  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/oauth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    // Map Google profile to user object
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: (profile.emails && profile.emails[0] && profile.emails[0].value) || null,
      picture: (profile.photos && profile.photos[0] && profile.photos[0].value) || null,
      provider: 'google'
    };
    return done(null, user);
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Initiate Google OAuth flow
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google OAuth callback
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/oauth/failure' }),
    (req, res) => {
      try {
        const user = req.user;
        
        // Create JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            provider: user.provider 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Redirect to frontend callback with token
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
      } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect(`${FRONTEND_URL}/auth/failure?error=${err.message}`);
      }
    }
  );

  // OAuth failure handler
  router.get('/failure', (req, res) => {
    res.status(401).json({
      success: false,
      message: 'OAuth authentication failed',
      error: req.query.error || 'Unknown error'
    });
  });
}

// Demo OAuth endpoint for testing (without real Google credentials)
router.get('/google/demo', (req, res) => {
  try {
    const demoUser = {
      id: 'demo_user_' + Date.now(),
      name: 'Demo User',
      email: 'demo@smartsubsidy.com',
      provider: 'google'
    };
    
    const token = jwt.sign(
      { 
        id: demoUser.id, 
        email: demoUser.email, 
        name: demoUser.name,
        provider: demoUser.provider 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend callback with demo token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Demo OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/auth/failure?error=${err.message}`);
  }
});

// Verify token endpoint (optional - for frontend to validate token)
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
  }
});

module.exports = router;
