import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create global Authentication Context
export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Authentication Provider Component.
 * Wraps the application to share authentication state and handlers.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Axios request interceptor to inject the JWT bearer token into every outbound API call
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Eject interceptor when token changes or provider unmounts to prevent memory leaks
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Query backend profile endpoint (/me) on initial loading if a cached token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`);
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout(); // Clear session if token is corrupt
          }
        } catch (err) {
          console.error('Session loading failed:', err.response?.data?.error || err.message);
          logout(); // Terminate session if verification fails
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  /**
   * Log in user with local credentials
   */
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.error || 'Authentication failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || 'A network error occurred during login.',
      };
    }
  };

  /**
   * Register a new local account
   */
  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, message: res.data.error || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || 'A network error occurred during registration.',
      };
    }
  };

  /**
   * Log out currently active user session
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * Trigger authentication update for Google OAuth redirect
   */
  const googleLogin = (jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, googleLogin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
