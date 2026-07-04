const jwt = require('jsonwebtoken');

/**
 * =========================================================================
 * WHY THE CALLBACK REDIRECT WITH TOKEN PATTERN IS REQUIRED
 * =========================================================================
 * 
 * 1. THE PROBLEM:
 *    OAuth 2.0 requires browser navigation. The user leaves the React frontend
 *    to authorize themselves on Google's domain, and Google redirects the
 *    browser back to the server's callback endpoint (/api/auth/google/callback).
 *    Because this is a standard HTTP GET redirect performed by the browser, it is
 *    NOT an AJAX/Fetch request. If the server responded with res.json({ token }),
 *    the browser would simply display the JSON string on a blank page. The React
 *    frontend would not be able to read it.
 * 
 * 2. THE SOLUTION:
 *    The server processes the callback, obtains user details (via Passport.js),
 *    creates a JWT token, and redirects the browser back to the frontend's domain
 *    with the JWT appended as a query parameter:
 *    `http://localhost:5173/oauth-redirect?token=JWT_VALUE`
 * 
 * 3. FRONTEND INTERCEPTION:
 *    The frontend SPA listens on the `/oauth-redirect` route. Using useEffect,
 *    it reads the URL's query parameters, extracts the token, stores it in 
 *    localStorage or context, and redirects the user inside the SPA to the dashboard.
 */

/**
 * @desc    Google OAuth Callback handler
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
exports.googleCallback = (req, res) => {
  try {
    // Passport.js places the authenticated user in req.user after success
    if (!req.user) {
      return res.status(401).redirect(`${process.env.FRONTEND_REDIRECT_URL || 'http://localhost:5173/oauth-redirect'}?error=authentication_failed`);
    }

    // Generate JWT token containing user's database ID
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '30d' }
    );

    // Redirect user browser back to React SPA with the token in query string
    const redirectUrl = `${process.env.FRONTEND_REDIRECT_URL || 'http://localhost:5173/oauth-redirect'}?token=${token}`;
    
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback controller error:', error.message);
    return res.status(500).redirect(`${process.env.FRONTEND_REDIRECT_URL || 'http://localhost:5173/oauth-redirect'}?error=server_error`);
  }
};
