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

  // SECURITY: Block students and teachers from accessing ANY dashboard routes
  // ProtectedRoute is ONLY used for dashboard routes (not student/teacher routes)
  // Students/teachers should NEVER see DashboardLayout (with sidebar) or dashboard pages
  // Complete role separation is mandatory - redirect them to their own pages immediately
  // CRITICAL: This check must happen BEFORE DashboardLayout renders (which includes Sidebar)
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isStudent = userRoles.includes('student') || user.profile === 'student';
  const isTeacher = userRoles.includes('teacher') || userRoles.includes('prof') || user.profile === 'teacher' || user.profile === 'prof';
  
  if (isStudent) {
    // Students can ONLY access /student/* routes - block all dashboard routes
    // Force immediate redirect - this bypasses React Router completely
    if (typeof window !== 'undefined' && window.location.pathname !== '/student') {
      console.log('[ProtectedRoute] Redirecting student to /student', { roles: userRoles, profile: user.profile });
      window.location.replace('/student'); // Use replace instead of href to prevent back button
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Redirecting to student page...</div>
        </div>
      );
    }
    return <StableRedirect to="/student" />;
  }
  if (isTeacher) {
    // Teachers can ONLY access /teacher/* routes - block all dashboard routes
    // Force immediate redirect - this bypasses React Router completely
    if (typeof window !== 'undefined' && window.location.pathname !== '/teacher') {
      console.log('[ProtectedRoute] Redirecting teacher to /teacher', { roles: userRoles, profile: user.profile });
      window.location.replace('/teacher'); // Use replace instead of href to prevent back button
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Redirecting to teacher page...</div>
        </div>
      );
    }
    return <StableRedirect to="/teacher" />;
  }

  // SECURITY: Use ONLY server-validated user data from React context
  // Never read from localStorage - it can be manipulated by attackers
  
  // RBAC: Check page access if requiredPage is specified
  if (requiredPage) {
    const pagePath = requiredPage.startsWith('/') ? requiredPage : `/${requiredPage}`;
    
    // Admin users have full access - bypass allowedPages check
    // Use ONLY server-validated roles from context (never localStorage)
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const isAdmin = userRoles.includes('admin');
    
    // Use ONLY server-validated allowedPages from context (never localStorage)
    const allowedPages = Array.isArray(user.allowedPages) ? user.allowedPages : [];
    
    const hasAccess = isAdmin || allowedPages.includes(pagePath);
    
    if (!hasAccess) {
      return <StableRedirect to={unauthorizedRedirect} />;
    }
  } else {
    // Fallback to profile-based check if no specific page is required
    // Use ONLY server-validated roles from context (never localStorage)
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const isAdmin = userRoles.includes('admin');
    
    // If admin (from server-validated roles), allow access regardless of profile check
    if (isAdmin) {
      return <>{children}</>;
    }
    
    // For non-admin users, check dashboard access if required
    // Profile is also server-validated, so this is safe
    if (requireDashboardAccess && !hasDashboardAccess(user.profile)) {
      return <StableRedirect to={authRedirect} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

