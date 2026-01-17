import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultRoute } from '../../utils/permissions';

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

  // SECURITY: Check roles from server-validated user data (from useAuth context)
  // Roles are validated from database on app init - cannot be manipulated client-side
  // CRITICAL: Roles are now in a separate table - users can have multiple roles
  // We should ONLY check the roles array, NOT the profile field
  // Normalize role codes to lowercase for case-insensitive comparison
  const userRoles = Array.isArray(user.roles) 
    ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
  
  // Check if user is student - ONLY check roles array (case-insensitive)
  // IGNORE profile field - roles are the source of truth
  const isStudent = userRoles.includes('student');
  
  if (!isStudent) {
    // Redirect non-students to their default route (profile page for dashboard users)
    // Use getDefaultRoute to determine the correct destination
    const defaultRoute = getDefaultRoute(user);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

export default StudentRoute;

