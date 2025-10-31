import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white shadow-lg fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <button
              type="button"
              aria-label="Open sidebar"
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white sm:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">EduSol</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <img
                  src={(user as any).avatarUrl || '/default-avatar.png'}
                  alt="avatar"
                  className="h-8 w-8 rounded-full border-2 border-white"
                />
                <span className="text-sm font-medium hidden xs:inline">{user.username}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="bg-transparent border border-white text-white hover:bg-white hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
