import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Compass, Home, User } from 'lucide-react';

/**
 * Navbar Component.
 * Sticky header providing routing controls for authenticated users.
 */
const Navbar = () => {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Do not render navbar if user is not authenticated
  if (!token || !user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-black tracking-tight text-transparent">
              VibeGrid
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Home size={18} />
              <span className="hidden sm:inline">Feed</span>
            </NavLink>

            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Compass size={18} />
              <span className="hidden sm:inline">Discover</span>
            </NavLink>

            <NavLink
              to={`/profile/${user.id || user._id}`}
              className={({ isActive }) =>
                `flex items-center space-x-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <User size={18} />
              <span className="hidden sm:inline">Profile</span>
            </NavLink>

            <div className="h-6 w-px bg-gray-100 hidden sm:block"></div>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to={`/profile/${user.id || user._id}`}
                className="block h-8 w-8 overflow-hidden rounded-full ring-2 ring-indigo-500/20 transition-opacity hover:opacity-85"
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 rounded-xl bg-gray-50 p-2 text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
