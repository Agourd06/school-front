import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasDashboardAccess } from '../../types/profile';
import { isStudentRole, isTeacherRole } from '../../utils/permissions';

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
  const location = useLocation();
  
  // Check if there's a token in localStorage - if yes, user was authenticated
  // This prevents redirects during permission refreshes when user becomes temporarily null
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  // Memoize redirect paths to prevent infinite loops
  const authRedirect = useMemo(() => redirectTo || '/auth', [redirectTo]);
  const unauthorizedRedirect = useMemo(() => redirectTo || '/unauthorized', [redirectTo]);

  // Show loading while checking auth - CRITICAL: Don't redirect during loading
  // This prevents redirects when user state is temporarily null during page reloads
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated - but only if:
  // 1. Loading is complete AND
  // 2. There's no token in localStorage (user was never authenticated)
  // If there's a token but user is null, it's likely a permission refresh - wait for user to be restored
  if (!user) {
    if (hasToken) {
      // Token exists but user is null - likely a permission refresh in progress
      // Wait a bit for user to be restored instead of redirecting
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Loading permissions...</div>
        </div>
      );
    } else {
      // No token and no user - user is not authenticated
      return <StableRedirect to={authRedirect} />;
    }
  }
  
  // TypeScript now knows user is not null
  const authenticatedUser = user;

  // SECURITY: Block students and teachers from accessing dashboard routes
  // BUT: Only if they have ONLY student/teacher roles (no dashboard roles)
  // Users with both teacher and dashboard roles (e.g., 'teacher' + 'finance') should access dashboard
  // ProtectedRoute is ONLY used for dashboard routes (not student/teacher routes)
  // CRITICAL: This check must happen BEFORE DashboardLayout renders (which includes Sidebar)
  // CRITICAL: Roles are now in a separate table - users can have multiple roles
  // We should ONLY check the roles array, NOT the profile field
  // Normalize role codes to lowercase for case-insensitive comparison
  const userRoles = Array.isArray(authenticatedUser.roles) 
    ? authenticatedUser.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
  
  // Define dashboard roles - users with these roles should access dashboard
  const dashboardRoles = ['admin', 'finance', 'direction', 'scholarity', 'support'];
  
  // Check if user has any dashboard roles (excluding student/teacher/parent)
  const hasDashboardRole = userRoles.some(role => 
    dashboardRoles.includes(role) || 
    // Custom roles (like '26c630a3') are also considered dashboard roles
    (!['student', 'teacher', 'parent', 'parents'].includes(role))
  );
  
  // Check if user is student or teacher - use helper functions from permissions
  const isStudent = isStudentRole(userRoles);
  const isTeacher = isTeacherRole(userRoles);
  
  // Only redirect if user has student/teacher role AND no dashboard roles
  if (isStudent && !hasDashboardRole) {
    // Students with ONLY student role can ONLY access /student/* routes - block all dashboard routes
    // Force immediate redirect - this bypasses React Router completely
    if (typeof window !== 'undefined' && window.location.pathname !== '/student') {
      window.location.replace('/student'); // Use replace instead of href to prevent back button
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Redirecting to student page...</div>
        </div>
      );
    }
    return <StableRedirect to="/student" />;
  }
  if (isTeacher && !hasDashboardRole) {
    // Teachers with ONLY teacher role can ONLY access /teacher/* routes - block all dashboard routes
    // Force immediate redirect - this bypasses React Router completely
    if (typeof window !== 'undefined' && window.location.pathname !== '/teacher') {
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
  
  // RBAC: Always check page access based on current route
  // IMPORTANT: Even admin users must have pages in allowedPages
  // The backend sets allowedPages based on role-page assignments
  // New admins only have /settings and /users in allowedPages
  const currentPath = location.pathname;
  
  // Use ONLY server-validated allowedPages from context (never localStorage)
  const allowedPages = Array.isArray(authenticatedUser.allowedPages) ? authenticatedUser.allowedPages : [];
  
  // SPECIAL CASE: /profile is always accessible to authenticated dashboard users
  // This is the user's own profile page, not a role-restricted page
  if (currentPath === '/profile' || requiredPage === '/profile') {
    // Allow access to profile page for all authenticated dashboard users
    // This bypasses the allowedPages check since it's the user's own profile
    // Continue to dashboard profile check below
  } else {
    // Normalize the route to check (ensure leading slash, no trailing slash)
    const normalizeRoute = (route: string): string => {
      let normalized = route.trim();
      if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
      }
      // Remove trailing slash (except for root)
      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    };
    
    // Check if user has access to the current route
    // If requiredPage is specified, use that; otherwise use current path
    const pageToCheck = requiredPage 
      ? normalizeRoute(requiredPage)
      : normalizeRoute(currentPath);
    
    // Normalize all allowedPages for comparison
    const normalizedAllowedPages = allowedPages.map(normalizeRoute);
    
    // Check if user has direct access to the route
    let hasPageAccess = normalizedAllowedPages.includes(pageToCheck);
    
    // Special handling for Settings routes
    const isSettingsRoute = pageToCheck.startsWith('/settings');
    if (!hasPageAccess && isSettingsRoute) {
      // For /settings route: allow if user has /settings page OR any settings sub-tab
      if (pageToCheck === '/settings') {
        hasPageAccess =
          normalizedAllowedPages.includes('/settings') ||
          normalizedAllowedPages.includes('/settings/colors') ||
          normalizedAllowedPages.includes('/settings/access') ||
          normalizedAllowedPages.includes('/settings/roles') ||
          normalizedAllowedPages.includes('/settings/types/link') ||
          normalizedAllowedPages.includes('/settings/types/classroom') ||
          normalizedAllowedPages.includes('/settings/types/planning');
      }
      // IMPORTANT: For settings sub-routes, do NOT grant access via parent /settings
      // Permissions are granular - user must have explicit access to each sub-tab
      // This ensures users with /settings page cannot access /settings/types unless explicitly assigned
    }
    
    // If no direct access and not a settings route, check parent routes
    if (!hasPageAccess && !isSettingsRoute) {
      // Check parent routes (e.g., /students allows access to /students/*)
      const pathParts = pageToCheck.split('/').filter(Boolean);
      for (let i = pathParts.length; i > 0; i--) {
        const parentPath = '/' + pathParts.slice(0, i).join('/');
        if (normalizedAllowedPages.includes(parentPath)) {
          hasPageAccess = true;
          break;
        }
      }
    }
    
    // Check page access - applies to all routes (with or without requiredPage)
    if (!hasPageAccess) {
      return <StableRedirect to={unauthorizedRedirect} />;
    }
  }
  
  // Additional check: verify user has dashboard access if required
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  // Dashboard access is granted if user has 'admin' or 'support' role
  if (requireDashboardAccess) {
    const userRoles = Array.isArray(authenticatedUser.roles) ? authenticatedUser.roles : [];
    const hasAdminRole = userRoles.includes('admin');
    const hasSupportRole = userRoles.includes('support');
    
    // Check roles first (new system), then fallback to profile (backwards compatibility)
    const hasDashboard = hasAdminRole || hasSupportRole || 
      (authenticatedUser.profile ? hasDashboardAccess(authenticatedUser.profile) : false);
    
    if (!hasDashboard) {
      return <StableRedirect to={authRedirect} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

