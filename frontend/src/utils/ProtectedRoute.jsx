import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Route guard component for protecting private routes.
 * Redirects unauthenticated users back to the Login screen.
 */
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    // Render loading spinner while checking token authentication with backend
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Redirect to login if user session token does not exist
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Render children components if authenticated
  return children;
};

export default ProtectedRoute;
