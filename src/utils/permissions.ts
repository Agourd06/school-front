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
 * Check if a user is a teacher
 * 
 * @param userRoles - Array of normalized (lowercase) role codes
 * @returns true if user has teacher role
 */
export const isTeacherRole = (userRoles: string[]): boolean => {
  return userRoles.includes('teacher');
};

/**
 * Check if a user is a student
 * 
 * @param userRoles - Array of normalized (lowercase) role codes
 * @returns true if user has student role
 */
export const isStudentRole = (userRoles: string[]): boolean => {
  return userRoles.includes('student');
};

/**
 * Get the default route for a user after login
 * All users go to their profile page first, then can navigate based on their role permissions
 * 
 * Note: This function should be memoized when used in components to prevent infinite loops
 */
export const getDefaultRoute = (user: { roles?: string[]; allowedPages?: string[] } | null): string => {
  if (!user) {
    return '/auth';
  }

  // Normalize roles once
  const userRoles = Array.isArray(user.roles) 
    ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
  
  if (userRoles.length === 0) {
    return '/profile';
  }
  
  // Define role sets for efficient lookup
  const dashboardRoles = new Set(['admin', 'finance', 'direction', 'scholarity', 'support']);
  const excludedRoles = new Set(['student', 'teacher', 'parent', 'parents']);
  
  // Check role types in single pass
  let hasStudent = false;
  let hasTeacher = false;
  let hasDashboard = false;
  
  for (const role of userRoles) {
    if (role === 'student') hasStudent = true;
    else if (role === 'teacher') hasTeacher = true;
    else if (dashboardRoles.has(role) || !excludedRoles.has(role)) hasDashboard = true;
  }
  
  // Route students/teachers only if they have no dashboard roles
  if (hasStudent && !hasDashboard) return '/student';
  if (hasTeacher && !hasDashboard) return '/teacher';

  // Dashboard users: route to first allowed page or profile
  const allowedPages = Array.isArray(user.allowedPages) ? user.allowedPages : [];
  return allowedPages.length > 0 ? allowedPages[0] : '/profile';
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
