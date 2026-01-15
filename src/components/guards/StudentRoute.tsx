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

  // SECURITY: Check roles/profile from server-validated user data (from useAuth context)
  // Roles and profile are validated from database on app init - cannot be manipulated client-side
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isStudent = userRoles.includes('student') || user.profile === 'student';
  
  if (!isStudent) {
    // Redirect non-students to dashboard or auth
    return <Navigate to={hasDashboardAccess(user.profile) ? '/programs' : redirectTo} replace />;
  }

  return <>{children}</>;
};

export default StudentRoute;

