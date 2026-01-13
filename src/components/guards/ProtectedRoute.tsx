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
    // Check both context and localStorage as fallback (for immediate post-login state sync)
    const contextRoles = Array.isArray(user.roles) ? user.roles : [];
    const storedUserStr = localStorage.getItem('user');
    let storedRoles: string[] = [];
    try {
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        storedRoles = Array.isArray(storedUser.roles) ? storedUser.roles : [];
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    // Use roles from context if available, otherwise fallback to localStorage (for immediate post-login)
    // Also check localStorage if context roles don't include admin (in case it was just set)
    // Fallback: Also check if profile is 'admin' (in case roles aren't set yet)
    const userRoles = contextRoles.length > 0 ? contextRoles : storedRoles;
    const isAdmin = userRoles.includes('admin') || storedRoles.includes('admin') || user.profile === 'admin';
    
    // Use user.allowedPages from context if available, otherwise check localStorage
    const contextAllowedPages = Array.isArray(user.allowedPages) ? user.allowedPages : [];
    let storedAllowedPages: string[] = [];
    try {
      const storedAllowedPagesStr = localStorage.getItem('allowedPages');
      if (storedAllowedPagesStr) {
        storedAllowedPages = JSON.parse(storedAllowedPagesStr);
      }
    } catch (e) {
      // Ignore parse errors
    }
    const allowedPages = contextAllowedPages.length > 0 ? contextAllowedPages : storedAllowedPages;
    
    const hasAccess = isAdmin || (Array.isArray(allowedPages) && allowedPages.includes(pagePath));
    
    if (!hasAccess) {
      return <StableRedirect to={unauthorizedRedirect} />;
    }
  } else {
    // Fallback to profile-based check if no specific page is required
    // BUT: Admin users (via roles) should always have access, regardless of profile check
    
    // Check if user is admin (from context or localStorage as fallback)
    // Always check localStorage as fallback for immediate post-login state sync
    const contextRoles = Array.isArray(user.roles) ? user.roles : [];
    const storedUserStr = localStorage.getItem('user');
    let storedRoles: string[] = [];
    try {
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        storedRoles = Array.isArray(storedUser.roles) ? storedUser.roles : [];
      }
    } catch (e) {
      // Ignore parse errors
    }
    // If context has roles, use them. Otherwise fallback to localStorage (for immediate post-login)
    // Also check localStorage if context roles don't include admin (in case it was just set)
    // Fallback: Also check if profile is 'admin' (in case roles aren't set yet)
    const userRoles = contextRoles.length > 0 ? contextRoles : storedRoles;
    const isAdmin = userRoles.includes('admin') || storedRoles.includes('admin') || user.profile === 'admin';
    
    // If admin, allow access regardless of profile check
    if (isAdmin) {
      return <>{children}</>;
    }
    
    // For non-admin users, check dashboard access if required
    if (requireDashboardAccess && !hasDashboardAccess(user.profile)) {
      return <StableRedirect to={authRedirect} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

