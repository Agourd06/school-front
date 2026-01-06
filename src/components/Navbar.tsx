import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFileUrl } from '../utils/apiConfig';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const company = user?.company;
  const companyLogo = company?.logo;

  const rawUser = user as { username?: string; email?: string } | null;
  const displayName = rawUser?.username || rawUser?.email || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk: string) => chunk[0])
    .join('')
    .toUpperCase();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 text-white shadow-md border-b border-blue-900/30"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <button
              type="button"
              aria-label="Open sidebar"
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 sm:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {user && companyLogo ? (
                <img
                  src={getFileUrl(companyLogo)}
                  alt={company?.name || 'Company logo'}
                  className="h-10 w-auto max-w-[200px] object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                />
              ) : (
                <img
                  src="/edusol_logo.png"
                  alt="Edusol - La fiabilité à portée de main"
                  className="h-12 w-auto object-contain drop-shadow-[5px_5px_15px_rgba(255,255,255,2)]"
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold text-white">{displayName}</span>
                  <span className="text-xs text-blue-100">Welcome back</span>
                </div>
                <Link
                  to="/profile"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/15 text-sm font-semibold uppercase hover:bg-white/25 transition-all cursor-pointer text-white shadow-sm"
                  title="View Profile"
                >
                  {initials || 'U'}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/35 transition-all text-white shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-blue-700 shadow-md hover:bg-blue-50 hover:shadow-lg transition-all font-semibold"
                >
                  Login
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
