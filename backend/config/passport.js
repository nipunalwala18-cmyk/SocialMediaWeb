const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * =========================================================================
 * UNDERSTANDING THE OAUTH 2.0 AUTHORIZATION CODE FLOW (API REDIRECT PATTERN)
 * =========================================================================
 * 
 * When a user logs in via Google:
 * 
 * 1. USER INITIATION: User clicks "Login with Google" on the React frontend.
 *    The frontend redirects the user to the Express API backend route:
 *    `GET /api/auth/google`.
 * 
 * 2. REDIRECT TO PROVIDER: Express triggers passport.authenticate('google'),
 *    which redirects the browser to Google's OAuth 2.0 Consent Screen.
 *    Google asks the user for permission to share their 'profile' and 'email'.
 * 
 * 3. AUTHORIZATION CODE GRANT: The user approves. Google redirects the user's
 *    browser back to the server's registered callback URL (`GOOGLE_CALLBACK_URL`),
 *    passing a temporary `code` in the URL query string (e.g., `?code=4/0Af...`).
 * 
 * 4. CODE EXCHANGE FOR TOKENS: Passport.js intercepts this request. It takes
 *    the temporary authorization code and makes an behind-the-scenes POST request
 *    to Google's token endpoint, exchanging it for an Access Token, Refresh Token,
 *    and ID Token.
 * 
 * 5. PROFILE FETCHING: Passport uses the Access Token to query Google's userinfo
 *    endpoint, receiving a JSON profile payload containing the user's details.
 * 
 * 6. STRATEGY VERIFICATION (Callback): The function defined below executes.
 *    We query MongoDB to locate the user:
 *    - Search by `googleId` to see if they've registered via Google previously.
 *    - If not, search by `email` to see if they registered locally. If yes,
 *      link the existing account by saving their `googleId`.
 *    - If no account exists, create a new record in MongoDB. Since they log in
 *      via Google, their `password` field is set to `null` (nullable).
 * 
 * 7. SESSION/JWT ISSUING: Once Passport completes (by calling done()), execution
 *    passes to the router callback controller where a custom JWT is created and 
 *    the browser is redirected to the frontend application:
 *    `http://localhost:5173/oauth-redirect?token=JWT`.
 */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'], // Fallback scope options
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract email and profile photo if available
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (!email) {
          return done(new Error('Google profile did not contain an email address.'), null);
        }

        // 1. Search for user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User already exists with Google authentication
          return done(null, user);
        }

        // 2. Fallback: Search for user by email to see if they created a local account first
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to their existing local account
          user.googleId = profile.id;
          if (!user.avatar || user.avatar.includes('placeholder')) {
            user.avatar = avatar; // Update avatar if default/missing
          }
          await user.save();
          return done(null, user);
        }

        // 3. Create a new user if no match found
        user = new User({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: avatar || undefined,
          password: null, // Nullable password since they authenticate via Google OAuth
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Note: Because we are using stateless JWT authentication for all subsequent requests,
// we do NOT need to implement passport.serializeUser() or passport.deserializeUser().
// Every request is validated by the JWT token.
