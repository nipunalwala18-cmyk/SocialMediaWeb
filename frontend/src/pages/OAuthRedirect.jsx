import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * OAuthRedirect Component.
 * Receives the redirect query string from Google OAuth completion:
 * /oauth-redirect?token=JWT
 * Saves the token and updates the application auth state.
 */
const OAuthRedirect = () => {
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Extract query params from URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // 2. Cache token and trigger AuthContext refresh
      googleLogin(token);
      // 3. Forward authenticated session to home feed
      navigate('/dashboard', { replace: true });
    } else {
      console.error('Google OAuth Authentication failed:', error);
      // Forward back to login screen with failure warning parameter
      navigate('/login?error=google_failed', { replace: true });
    }
  }, [location, googleLogin, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center">
      {/* Loading interface while token parse completes */}
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      <h2 className="mt-4 text-xl font-semibold text-gray-700">Verifying Google account...</h2>
      <p className="mt-2 text-sm text-gray-500 font-medium text-gray-400">Please wait while we establish your session</p>
    </div>
  );
};

export default OAuthRedirect;
