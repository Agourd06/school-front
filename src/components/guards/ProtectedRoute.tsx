import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasDashboardAccess } from '../../types/profile';

// Stable redirect component to prevent infinite loops
const StableRedirect: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  // Only redirect if we're not already on the target route
  const shouldRedirect = location.pathname !== to;
  return shouldRedirect ? <Navigate to={to} replace /> : null;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * If true, only allows access to users with dashboard access (admin/support)
   * If false, allows any authenticated user
   * Default: true
   */
  requireDashboardAccess?: boolean;
  /**
   * Specific page path to check access for (RBAC)
   * If provided, checks if user has access to this specific page
   * If not provided, falls back to profile-based check
   */
  requiredPage?: string;
  /**
   * Redirect path if access is denied
   * Default: '/auth' or '/unauthorized' for page access
   */
  redirectTo?: string;
}

/**
 * Route guard component that protects routes based on authentication, profile, and RBAC
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * With RBAC page check:
 * <ProtectedRoute requiredPage="/students">
 *   <StudentsPage />
 * </ProtectedRoute>
 * 
 * Or with custom access requirements:
 * <ProtectedRoute requireDashboardAccess={false}>
 *   <YourComponent />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireDashboardAccess = true,
  requiredPage,
  redirectTo,
}) => {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // Memoize redirect paths to prevent infinite loops
  const authRedirect = useMemo(() => redirectTo || '/auth', [redirectTo]);
  const unauthorizedRedirect = useMemo(() => redirectTo || '/unauthorized', [redirectTo]);

  // Redirect if not authenticated
  if (!user) {
    return <StableRedirect to={authRedirect} />;
  }

  // RBAC: Check page access if requiredPage is specified
  if (requiredPage) {
    const pagePath = requiredPage.startsWith('/') ? requiredPage : `/${requiredPage}`;
    
    // Admin users have full access - bypass allowedPages check
    const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
    
    // Use user.allowedPages from context instead of localStorage
    const hasAccess = isAdmin || (Array.isArray(user.allowedPages) && user.allowedPages.includes(pagePath));
    
    if (!hasAccess) {
      return <StableRedirect to={unauthorizedRedirect} />;
    }
  } else {
    // Fallback to profile-based check if no specific page is required
    // Check dashboard access if required
    if (requireDashboardAccess && !hasDashboardAccess(user.profile)) {
      return <StableRedirect to={authRedirect} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

