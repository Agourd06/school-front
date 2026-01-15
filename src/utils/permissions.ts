import { useAuth } from '../hooks/useAuth';

/**
 * SECURITY: These functions must use React context (server-validated data)
 * Never read from localStorage directly - it can be manipulated by attackers
 * 
 * Note: These functions require useAuth hook and should only be called within React components
 * For non-component contexts, use the usePermissions hook instead
 */

/**
 * Check if user has a specific role
 * WARNING: This function requires user from useAuth hook - cannot be called outside React components
 * @deprecated Use usePermissions hook instead for React components
 */
export const hasRole = (user: { roles?: string[] } | null, roleCode: string): boolean => {
  if (!user) return false;
  return Array.isArray(user.roles) && user.roles.includes(roleCode);
};

/**
 * Check if user has access to a specific page/route
 * IMPORTANT: Even admin users must have pages in allowedPages - no bypass
 * WARNING: This function requires user from useAuth hook - cannot be called outside React components
 * @deprecated Use usePermissions hook instead for React components
 */
export const hasPageAccess = (user: { roles?: string[]; allowedPages?: string[] } | null, pagePath: string): boolean => {
  if (!user) return false;
  
  // IMPORTANT: Even admin users must have pages in allowedPages
  // The backend sets allowedPages based on role-page assignments
  // New admins only have /settings and /users in allowedPages
  const allowedPages = Array.isArray(user.allowedPages) ? user.allowedPages : [];
  return allowedPages.includes(pagePath);
};

/**
 * Check if user has admin role
 * WARNING: This function requires user from useAuth hook - cannot be called outside React components
 * @deprecated Use usePermissions hook instead for React components
 */
export const isAdmin = (user: { roles?: string[] } | null): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Get all allowed pages for current user
 * WARNING: This function requires user from useAuth hook - cannot be called outside React components
 * @deprecated Use usePermissions hook instead for React components
 */
export const getAllowedPages = (user: { allowedPages?: string[] } | null): string[] => {
  if (!user) return [];
  return Array.isArray(user.allowedPages) ? user.allowedPages : [];
};

/**
 * Get all roles for current user
 * WARNING: This function requires user from useAuth hook - cannot be called outside React components
 * @deprecated Use usePermissions hook instead for React components
 */
export const getUserRoles = (user: { roles?: string[] } | null): string[] => {
  if (!user) return [];
  return Array.isArray(user.roles) ? user.roles : [];
};

/**
 * Get the default route for a user after login
 * All users go to their profile page first, then can navigate based on their role permissions
 * 
 * Note: This function should be memoized when used in components to prevent infinite loops
 */
export const getDefaultRoute = (user: { profile?: string; roles?: string[]; allowedPages?: string[] } | null): string => {
  if (!user) {
    return '/auth';
  }

  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isStudent = userRoles.includes('student') || user.profile === 'student';
  const isTeacher = userRoles.includes('teacher') || userRoles.includes('prof') || user.profile === 'teacher' || user.profile === 'prof';

  // Student and teacher profiles have their own routes
  if (isStudent) {
    return '/student';
  }
  // Handle both 'teacher' and 'prof' (professor) profiles - route to teacher pages
  if (isTeacher) {
    return '/teacher';
  }

  // All dashboard users (admin, finance, etc.) go to profile page first
  // They can then navigate to allowed routes based on their role permissions
  return '/profile';
};

/**
 * React hook version of permission checks
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasRoleCheck = (roleCode: string): boolean => {
    return Array.isArray(user?.roles) && user.roles.includes(roleCode);
  };
  
  const hasPageAccessCheck = (pagePath: string): boolean => {
    if (!user?.allowedPages || !Array.isArray(user.allowedPages)) {
      return false;
    }
    
    // Normalize the route to check (same logic as ProtectedRoute)
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
    
    const normalizedPagePath = normalizeRoute(pagePath);
    const normalizedAllowedPages = user.allowedPages.map(normalizeRoute);
    
    return normalizedAllowedPages.includes(normalizedPagePath);
  };
  
  const isAdminCheck = (): boolean => {
    return hasRoleCheck('admin');
  };
  
  return {
    hasRole: hasRoleCheck,
    hasPageAccess: hasPageAccessCheck,
    isAdmin: isAdminCheck,
    allowedPages: user?.allowedPages || [],
    roles: user?.roles || [],
  };
};
