import { useEffect, useRef } from 'react';
import { pagesApi } from '../api/pages';
import { rolesApi } from '../api/roles';
import { useUserRoles } from './useUserRoles';
import { useAuth } from './useAuth';

/**
 * Hook to restrict new admin users to only /settings and /users pages
 * 
 * ⚠️ SAFETY NET ONLY: The backend now handles this automatically during user creation.
 * This hook should only run if the backend restriction failed for some reason.
 * 
 * This hook acts as a safety net that:
 * 1. Checks if the user is an admin (profile === 'admin')
 * 2. Gets the user's roles
 * 3. For each admin role, checks if it has more than just /settings and /users pages
 * 4. If so, removes all other pages and keeps only /settings and /users
 * 5. Refreshes the user's permissions to reflect the changes
 * 
 * If this hook needs to restrict pages, it indicates the backend restriction failed.
 * Check backend logs to investigate why the restriction wasn't applied during user creation.
 * 
 * @param enabled - Set to false to disable this safety net (default: true)
 */
export const useRestrictNewAdminRole = (enabled: boolean = true) => {
  const { user, refreshPermissions } = useAuth();
  const userId = user?.id ?? null;
  // Check both old profile field and new roles array for backward compatibility
  const isAdmin = user?.profile === 'admin' || user?.roles?.includes('admin') === true;
  
  const { data: userRoles = [] } = useUserRoles(userId);
  const hasRestricted = useRef(false);

  useEffect(() => {
    // Only run if enabled, for admin users, once per session
    if (!enabled || !isAdmin || !userId || hasRestricted.current || userRoles.length === 0) {
      return;
    }

    const restrictAdminRole = async () => {
      try {
        // Mark as restricted immediately to prevent duplicate calls
        hasRestricted.current = true;
        
        // Get all pages to find the IDs for /settings and /users
        const allPagesResponse = await pagesApi.getAll({ limit: 100 });
        const allPages = allPagesResponse.data;
        
        // Find pages for /settings and /users routes
        const settingsPage = allPages.find(p => p.route === '/settings');
        const usersPage = allPages.find(p => p.route === '/users');
        
        if (!settingsPage || !usersPage) {
          return;
        }

        const allowedPageIds = new Set([settingsPage.id, usersPage.id]);

        // Process each role assigned to the user
        for (const role of userRoles) {
          // Get pages currently assigned to this role
          const rolePages = await rolesApi.getPages(role.id);
          const currentPageIds = new Set(rolePages.map(p => p.id));
          
          // Check if role has pages other than /settings and /users
          const hasExtraPages = rolePages.some(p => !allowedPageIds.has(p.id));
          
          if (hasExtraPages) {
            // ⚠️ WARNING: Backend should have restricted this during user creation
            // If we reach here, the backend restriction failed
            console.warn(
              `[RestrictAdminRole] ⚠️ SAFETY NET ACTIVATED: Role "${role.label}" (${role.code}) has extra pages. ` +
              `Backend should have restricted this during user creation. ` +
              `Check backend logs to investigate why restriction wasn't applied.`
            );

            // Remove all pages that are not /settings or /users
            for (const page of rolePages) {
              if (!allowedPageIds.has(page.id)) {
                try {
                  await rolesApi.removePage(role.id, page.id);
                } catch (error) {
                  console.error(`[RestrictAdminRole] Failed to remove page ${page.id} from role ${role.id}:`, error);
                }
              }
            }

            // Ensure /settings and /users pages are assigned
            if (!currentPageIds.has(settingsPage.id)) {
              try {
                await rolesApi.assignPage(role.id, settingsPage.id);
              } catch (error) {
                console.error(`[RestrictAdminRole] Failed to assign /settings page to role ${role.id}:`, error);
              }
            }

            if (!currentPageIds.has(usersPage.id)) {
              try {
                await rolesApi.assignPage(role.id, usersPage.id);
              } catch (error) {
                console.error(`[RestrictAdminRole] Failed to assign /users page to role ${role.id}:`, error);
              }
            }
          }
        }

        // CRITICAL: Refresh user's permissions after restricting role pages
        // The user's allowedPages are cached and need to be refreshed from the server
        try {
          await refreshPermissions();
          // IMPORTANT: We no longer reload the page because:
          // 1. refreshPermissions() already updates the user state in AuthContext
          // 2. React components will re-render automatically when user state changes
          // 3. Page reload causes user state to be temporarily null, triggering unwanted redirects
          // The permissions are now live-updated without a full page reload
        } catch (refreshError) {
          console.error('[RestrictAdminRole] Failed to refresh user permissions:', refreshError);
          // Only reload if refreshPermissions fails - this is a last resort
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('[RestrictAdminRole] Error restricting admin role:', error);
        // Reset flag on error so it can retry
        hasRestricted.current = false;
      }
    };

    // Run restriction after a short delay to ensure pages are initialized
    const timeoutId = setTimeout(() => {
      restrictAdminRole();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, isAdmin, userId, userRoles, refreshPermissions]);
};
