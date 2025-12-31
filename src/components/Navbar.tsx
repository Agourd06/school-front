import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

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
      className="fixed top-0 left-0 right-0 z-40 text-primary-foreground shadow-lg border-b border-primary/30"
      style={{
        background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 92%, transparent), color-mix(in srgb, var(--color-secondary) 80%, transparent))',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <button
              type="button"
              aria-label="Open sidebar"
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/70 sm:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">EduSol</span>
              <span className="hidden sm:inline text-xs uppercase tracking-[0.25em] text-primary-foreground/70">School Admin</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-xs text-primary-foreground/70">Welcome back</span>
                </div>
                <Link
                  to="/profile"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-sm font-semibold uppercase hover:bg-white/30 transition-colors cursor-pointer"
                  title="View Profile"
                >
                  {initials || 'U'}
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground/10 border border-primary-foreground/30 hover:bg-primary-foreground/20 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-transparent border border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
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
