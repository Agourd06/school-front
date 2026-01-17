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
export const getDefaultRoute = (user: { profile?: string; roles?: string[]; allowedPages?: string[] } | null): string => {
  if (!user) {
    return '/auth';
  }

  // CRITICAL: Roles are now in a separate table - users can have multiple roles
  // We should ONLY check the roles array, NOT the profile field
  // The profile field may be incorrectly set by the backend and should be ignored for routing
  // Normalize role codes to lowercase for case-insensitive comparison
  const userRoles = Array.isArray(user.roles) 
    ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
  
  // Define dashboard roles - users with these roles should go to dashboard
  // These are roles that have access to the main dashboard with sidebar
  const dashboardRoles = ['admin', 'finance', 'direction', 'scholarity', 'support'];
  
  // Check if user has any dashboard roles (excluding student/teacher/parent)
  const hasDashboardRole = userRoles.some(role => 
    dashboardRoles.includes(role) || 
    // Custom roles (like '26c630a3') are also considered dashboard roles
    (!['student', 'teacher', 'parent', 'parents'].includes(role))
  );
  
  // Check if user is student or teacher - use helper functions
  const isStudent = isStudentRole(userRoles);
  const isTeacher = isTeacherRole(userRoles);
  
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[getDefaultRoute] User data:', {
      profile: user.profile, // For debugging only - not used for routing
      roles: user.roles,
      normalizedRoles: userRoles,
      isStudent,
      isTeacher,
      hasDashboardRole,
    });
  }

  // CRITICAL: Only route to student/teacher pages if user has ONLY student/teacher roles
  // If user has dashboard roles in addition to student/teacher roles, route to dashboard
  // This allows users with multiple roles (e.g., 'teacher' + 'finance') to access dashboard
  
  // Student routing: only if they have student role AND no dashboard roles
  if (isStudent && !hasDashboardRole) {
    if (import.meta.env.DEV) {
      console.log('[getDefaultRoute] User identified as student (no dashboard roles), routing to /student');
    }
    return '/student';
  }
  
  // Teacher routing: only if they have teacher role AND no dashboard roles
  if (isTeacher && !hasDashboardRole) {
    if (import.meta.env.DEV) {
      console.log('[getDefaultRoute] User identified as teacher (no dashboard roles), routing to /teacher');
    }
    return '/teacher';
  }

  // All dashboard users (admin, finance, etc.) go to profile page first
  // They can then navigate to allowed routes based on their role permissions
  if (import.meta.env.DEV) {
    console.log('[getDefaultRoute] User identified as dashboard user, routing to /profile');
  }
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
