import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const rawUser = user as any;
  const displayName = rawUser?.username || rawUser?.email || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk: string) => chunk[0])
    .join('')
    .toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-lg border-b border-blue-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <button
              type="button"
              aria-label="Open sidebar"
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-500/40 focus:outline-none focus:ring-2 focus:ring-white/80 sm:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">EduSol</span>
              <span className="hidden sm:inline text-xs uppercase tracking-[0.25em] text-white/70">School Admin</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-xs text-white/70">Welcome back</span>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-sm font-semibold uppercase">
                  {initials || 'U'}
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-transparent border border-white/60 text-white hover:bg-white hover:text-blue-600 transition-colors"
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
