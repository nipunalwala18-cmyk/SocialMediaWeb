const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

// Configure extraction options for the JWT Strategy
const opts = {
  // Extract token from 'Authorization: Bearer <token>' header
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Secret key used to verify the token signature
  secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
};

/**
 * Configure Passport JWT strategy
 * If token signature is valid, the payload is decoded and passed to the callback.
 * We fetch the user from MongoDB and omit their sensitive password field.
 */
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Find the user using the 'id' stored in the JWT token payload
      const user = await User.findById(jwt_payload.id).select('-password');
      if (user) {
        return done(null, user);
      }
      // Token is valid but user no longer exists in database
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);
