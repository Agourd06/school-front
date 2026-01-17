import { useEffect, useRef } from 'react';
import { pagesApi } from '../api/pages';
import { rolesApi } from '../api/roles';
import { useUserRoles } from './useUserRoles';
import { useAuth } from './useAuth';

/**
 * Hook to verify admin role page assignments (READ-ONLY CHECK)
 * 
 * ⚠️ READ-ONLY: The backend handles all page assignments during user creation.
 * This hook only logs warnings if admin roles have unexpected pages.
 * 
 * This hook does NOT assign or remove pages - it only verifies:
 * 1. Checks if the user is an admin (profile === 'admin')
 * 2. Gets the user's roles
 * 3. For each admin role, verifies it has the expected default pages
 * 4. Logs warnings if unexpected pages are found (for debugging)
 * 
 * The backend is responsible for assigning pages to admin roles.
 * This hook is purely for monitoring and debugging.
 * 
 * @param enabled - Set to false to disable this check (default: true)
 */
export const useRestrictNewAdminRole = (enabled: boolean = true) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Check both old profile field and new roles array for backward compatibility
  // Profile field no longer exists - use only roles
  const isAdmin = user?.roles?.includes('admin') === true;
  
  const { data: userRoles = [] } = useUserRoles(userId);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run if enabled, for admin users, once per session
    if (!enabled || !isAdmin || !userId || hasChecked.current || userRoles.length === 0) {
      return;
    }

    const verifyAdminRolePages = async () => {
      try {
        // Mark as checked immediately to prevent duplicate calls
        hasChecked.current = true;
        
        // Get all pages to find IDs for expected admin routes
        const allPages = await pagesApi.getAllPages();

        // Expected default admin routes (backend should assign these)
        const expectedRoutes = new Set([
          '/users',
          '/settings', // Parent route (page 4)
          '/settings/access', // Page 5
          '/settings/roles', // Page 6
          '/settings/colors', // Page 7
          // Optional granular types tabs (if assigned by backend)
          '/settings/types/link',
          '/settings/types/classroom',
          '/settings/types/planning',
        ]);

        const expectedPages = allPages.filter((page) => expectedRoutes.has(page.route));
        const expectedPageIds = new Set(expectedPages.map((page) => page.id));

        if (expectedPageIds.size === 0) {
          return;
        }

        // Process each role assigned to the user (READ-ONLY verification)
        for (const role of userRoles) {
          // Get pages currently assigned to this role
          const rolePages = await rolesApi.getPages(role.id);
          const currentPageIds = new Set(rolePages.map(p => p.id));
          
          // Check if role has unexpected pages (for logging only)
          const unexpectedPages = rolePages.filter((p) => !expectedPageIds.has(p.id));
          
          if (unexpectedPages.length > 0) {
            // Log warning but DO NOT modify - backend is responsible
            console.warn(
              `[VerifyAdminRole] ⚠️ Role "${role.label}" (${role.code}) has unexpected pages: ` +
              `${unexpectedPages.map(p => p.route).join(', ')}. ` +
              `Backend should handle page assignments. This is informational only.`
            );
          }

          // Check if expected pages are missing (for logging only)
          const missingPages = expectedPages.filter((p) => !currentPageIds.has(p.id));
          if (missingPages.length > 0 && missingPages.some(p => p.route !== '/settings/types/link' && p.route !== '/settings/types/classroom' && p.route !== '/settings/types/planning')) {
            // Only log if core pages are missing (types are optional)
            const coreMissing = missingPages.filter(p => 
              p.route === '/users' || 
              p.route === '/settings' || 
              p.route === '/settings/access' || 
              p.route === '/settings/roles' || 
              p.route === '/settings/colors'
            );
            if (coreMissing.length > 0) {
              console.warn(
                `[VerifyAdminRole] ⚠️ Role "${role.label}" (${role.code}) is missing expected pages: ` +
                `${coreMissing.map(p => p.route).join(', ')}. ` +
                `Backend should assign these during admin creation.`
              );
            }
          }
        }

        // No page modifications - backend handles all assignments
        // No permission refresh needed - this is read-only
      } catch (error) {
        console.error('[VerifyAdminRole] Error verifying admin role pages:', error);
        // Reset flag on error so it can retry
        hasChecked.current = false;
      }
    };

    // Run verification after a short delay to ensure pages are initialized
    const timeoutId = setTimeout(() => {
      verifyAdminRolePages();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, isAdmin, userId, userRoles]);
};
