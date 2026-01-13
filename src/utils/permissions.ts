import { useAuth } from '../hooks/useAuth';

/**
 * Check if user has a specific role
 */
export const hasRole = (roleCode: string): boolean => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return Array.isArray(user.roles) && user.roles.includes(roleCode);
};

/**
 * Check if user has access to a specific page/route
 * Admin users always have access (bypass check)
 */
export const hasPageAccess = (pagePath: string): boolean => {
  // Admin users have full access - bypass allowedPages check
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
  
  if (isAdmin) {
    return true; // Admin has access to all pages
  }
  
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  return Array.isArray(allowedPages) && allowedPages.includes(pagePath);
};

/**
 * Check if user has admin role
 */
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

/**
 * Get all allowed pages for current user
 */
export const getAllowedPages = (): string[] => {
  const allowedPages = JSON.parse(localStorage.getItem('allowedPages') || '[]');
  return Array.isArray(allowedPages) ? allowedPages : [];
};

/**
 * Get all roles for current user
 */
export const getUserRoles = (): string[] => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return Array.isArray(user.roles) ? user.roles : [];
};

/**
 * Get the default route for a user after login
 * All users go to their profile page first, then can navigate based on their role permissions
 * 
 * Note: This function should be memoized when used in components to prevent infinite loops
 */
export const getDefaultRoute = (user: { profile?: string; allowedPages?: string[] } | null): string => {
  if (!user) {
    return '/auth';
  }

  // Student and teacher profiles have their own routes
  if (user.profile === 'student') {
    return '/student';
  }
  if (user.profile === 'teacher') {
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
    return Array.isArray(user?.allowedPages) && user.allowedPages.includes(pagePath);
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
