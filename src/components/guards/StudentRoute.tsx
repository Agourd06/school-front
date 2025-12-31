import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasDashboardAccess } from '../../types/profile';

interface StudentRouteProps {
  children: React.ReactNode;
  /**
   * Redirect path if access is denied
   * Default: '/auth'
   */
  redirectTo?: string;
}

/**
 * Route guard component that protects routes for students only
 * 
 * Usage:
 * <StudentRoute>
 *   <YourComponent />
 * </StudentRoute>
 */
const StudentRoute: React.FC<StudentRouteProps> = ({
  children,
  redirectTo = '/auth',
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user is a student
  if (user.profile !== 'student') {
    // Redirect non-students to dashboard or auth
    return <Navigate to={hasDashboardAccess(user.profile) ? '/programs' : redirectTo} replace />;
  }

  return <>{children}</>;
};

export default StudentRoute;

