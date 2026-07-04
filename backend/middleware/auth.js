const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Custom authentication middleware.
 * Verifies the JWT token passed in the Authorization header.
 * 
 * =========================================================================
 * 401 UNAUTHORIZED vs 403 FORBIDDEN
 * =========================================================================
 * - 401 Unauthorized: The user has not provided valid authentication credentials.
 *   The server does not know who the requester is. Examples include: missing token,
 *   malformed token, or an expired session.
 * 
 * - 403 Forbidden: The user IS authenticated (the server knows exactly who they are),
 *   but they do not have permission to access the resource or perform the operation.
 *   Example: A logged-in user attempting to delete another user's post.
 */
const auth = async (req, res, next) => {
  let token;

  // Check for token in headers (format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split "Bearer <token>" and extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

      // Fetch user from database using decoded id, excluding the password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found, authorization denied',
        });
      }

      // Proceed to the next middleware or controller
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed or expired',
      });
    }
  }

  // If no token is provided in headers
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided',
    });
  }
};

module.exports = auth;
