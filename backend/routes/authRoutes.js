const express = require('express');
const passport = require('passport');
const { register, login, getMe } = require('../controllers/authController');
const { googleCallback } = require('../controllers/oauthController');
const auth = require('../middleware/auth');

const router = express.Router();

// Local Authentications
router.post('/register', register);
router.post('/login', login);

/**
 * Google OAuth routes
 * 
 * 1. Initiates the OAuth login flow. Google Consent screen will open.
 *    We request 'profile' (name, avatar) and 'email' scopes.
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * 2. Callback URL where Google sends the user after authentication.
 *    Passport intercepts the authorization code and exchanges it.
 *    If successful, googleCallback in oauthController generates a JWT and 
 *    redirects to the frontend SPA.
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failed' }),
  googleCallback
);

// Fallback path in case Google auth strategy fails
router.get('/failed', (req, res) => {
  return res.status(401).json({
    success: false,
    error: 'Google Authentication failed. Please try again.',
  });
});

// Get active session profile details
router.get('/me', auth, getMe);

module.exports = router;
