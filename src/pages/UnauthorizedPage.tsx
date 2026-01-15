import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return '/auth';
    if (user.profile === 'student') return '/student';
    // Handle both 'teacher' and 'prof' (professor) profiles
    if (user.profile === 'teacher' || user.profile === 'prof') return '/teacher';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-danger"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-heading mb-4">Access Denied</h1>
        <p className="text-muted mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link
          to={getRedirectPath()}
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
